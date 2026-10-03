const { db } = require('../../db');
const { inventory, reservations } = require('../../db/schema');
const { eq, inArray, sql } = require('drizzle-orm');

async function reserveInventory(items, cartId = null, orderId = null) {
  // Sort items deterministically by variant_id to prevent deadlocks
  const sortedItems = [...items].sort((a, b) => a.variant_id.localeCompare(b.variant_id));
  const variantIds = sortedItems.map(item => item.variant_id);

  return await db.transaction(async (tx) => {
    // 1. & 2. Lock required rows in deterministic order
    // Drizzle doesn't guarantee ORDER BY when fetching IN, but by locking them in a single query,
    // Postgres will acquire locks. To be perfectly safe against deadlocks, one could lock row-by-row in order.
    // Let's do row-by-row in order to ensure deterministic locking.
    
    const lockedInventory = {};
    for (const item of sortedItems) {
      const [inv] = await tx
        .select()
        .from(inventory)
        .where(eq(inventory.variant_id, item.variant_id))
        .for('update');
        
      if (!inv) {
        throw new Error(`Inventory record not found for variant ${item.variant_id}`);
      }
      lockedInventory[item.variant_id] = inv;
    }

    // 3 & 4. Verify available quantity
    for (const item of sortedItems) {
      const inv = lockedInventory[item.variant_id];
      if (inv.available_quantity < item.quantity) {
        throw new Error(`Insufficient stock for variant ${item.variant_id}`);
      }
    }

    const createdReservations = [];

    // 5, 6 & 7. Update inventory and create reservations
    for (const item of sortedItems) {
      const inv = lockedInventory[item.variant_id];
      
      await tx
        .update(inventory)
        .set({
          available_quantity: sql`${inventory.available_quantity} - ${item.quantity}`,
          reserved_quantity: sql`${inventory.reserved_quantity} + ${item.quantity}`,
          updated_at: new Date()
        })
        .where(eq(inventory.variant_id, item.variant_id));

      const [res] = await tx
        .insert(reservations)
        .values({
          variant_id: item.variant_id,
          cart_id: cartId,
          order_id: orderId,
          quantity: item.quantity,
          status: 'RESERVED',
        })
        .returning();
        
      createdReservations.push(res);
    }

    // 8. Commit (handled by transaction closure)
    return createdReservations;
  });
}

async function releaseReservation(reservationId) {
  return await db.transaction(async (tx) => {
    const [res] = await tx
      .select()
      .from(reservations)
      .where(eq(reservations.id, reservationId))
      .for('update');

    if (!res) throw new Error('Reservation not found');
    if (res.status !== 'RESERVED') throw new Error(`Reservation is in status ${res.status}, cannot release`);

    const [inv] = await tx
      .select()
      .from(inventory)
      .where(eq(inventory.variant_id, res.variant_id))
      .for('update');

    await tx
      .update(inventory)
      .set({
        available_quantity: sql`${inventory.available_quantity} + ${res.quantity}`,
        reserved_quantity: sql`${inventory.reserved_quantity} - ${res.quantity}`,
        updated_at: new Date()
      })
      .where(eq(inventory.variant_id, res.variant_id));

    const [updatedRes] = await tx
      .update(reservations)
      .set({
        status: 'RELEASED',
        updated_at: new Date()
      })
      .where(eq(reservations.id, reservationId))
      .returning();

    return updatedRes;
  });
}

module.exports = {
  reserveInventory,
  releaseReservation
};
