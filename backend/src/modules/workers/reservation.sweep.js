const { db } = require('../../db');
const { inventory, reservations, orders, payments } = require('../../db/schema');
const { eq, sql, and, lt } = require('drizzle-orm');
const { transitionOrderStatus } = require('../orders/orders.service');

let isSweeping = false;
let sweepIntervalId = null;

async function runReservationSweep() {
  if (isSweeping) return;
  isSweeping = true;
  
  try {
    const candidates = await db.select({ 
      id: reservations.id, 
      order_id: reservations.order_id, 
      variant_id: reservations.variant_id, 
      quantity: reservations.quantity 
    })
    .from(reservations)
    .where(and(eq(reservations.status, 'RESERVED'), lt(reservations.expires_at, new Date())))
    .limit(100);

    for (const candidate of candidates) {
      await db.transaction(async (tx) => {
        let orderPaid = false;
        
        // Lock order FIRST to match payment.worker lock order and avoid deadlock
        if (candidate.order_id) {
          const [order] = await tx.select().from(orders)
            .where(eq(orders.id, candidate.order_id))
            .for('update');
            
          if (order && order.status === 'PAID') {
            orderPaid = true;
          }
        }

        // Lock the reservation SECOND
        const [lockedRes] = await tx.select().from(reservations)
          .where(and(eq(reservations.id, candidate.id), eq(reservations.status, 'RESERVED')))
          .for('update', { skipLocked: true });

        if (!lockedRes) {
          return; // Skip if already processed by another worker or state changed
        }

        console.log(`[ReservationSweep] Processing expired reservation ${lockedRes.id}`);

        if (orderPaid) {
          await tx.update(reservations)
            .set({ status: 'CONFIRMED_SOLD', updated_at: new Date() })
            .where(eq(reservations.id, lockedRes.id));
          console.log(`[ReservationSweep] Reservation ${lockedRes.id} confirmed (Order PAID)`);
        } else {
          // Lock inventory THIRD
          const [inv] = await tx.select().from(inventory)
            .where(eq(inventory.variant_id, lockedRes.variant_id))
            .for('update');

          if (inv) {
            await tx.update(inventory)
              .set({
                available_quantity: sql`${inventory.available_quantity} + ${lockedRes.quantity}`,
                reserved_quantity: sql`${inventory.reserved_quantity} - ${lockedRes.quantity}`,
                updated_at: new Date()
              })
              .where(eq(inventory.variant_id, lockedRes.variant_id));
          }

          await tx.update(reservations)
            .set({ status: 'RELEASED', updated_at: new Date() })
            .where(eq(reservations.id, lockedRes.id));
            
          console.log(`[ReservationSweep] Reservation ${lockedRes.id} released`);
          
          if (candidate.order_id) {
            const [orderData] = await tx.select().from(orders).where(eq(orders.id, candidate.order_id));
            if (orderData && orderData.status === 'PAYMENT_PENDING') {
              try {
                await transitionOrderStatus(orderData.id, 'CANCELED', tx);
                console.log(`[ReservationSweep] Order ${orderData.id} CANCELED due to timeout`);
              } catch (e) {
                console.log(`[ReservationSweep] Could not cancel order: ${e.message}`);
              }
              
              await tx.update(payments)
                .set({ status: 'failed', updated_at: new Date() })
                .where(and(eq(payments.order_id, orderData.id), eq(payments.status, 'pending')));
            }
          }
        }
      });
    }
  } catch (err) {
    console.error(`[ReservationSweep] Error during sweep:`, err);
  } finally {
    isSweeping = false;
  }
}

function startSweep() {
  sweepIntervalId = setInterval(runReservationSweep, 60000); // every minute
}

function stopSweep() {
  if (sweepIntervalId) clearInterval(sweepIntervalId);
}

module.exports = {
  startSweep,
  stopSweep,
  runReservationSweep
};
