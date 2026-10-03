const { Worker } = require('bullmq');
const { connection } = require('./queues');
const { db } = require('../../db');
const { inventory, reservations, orders } = require('../../db/schema');
const { eq, sql, and } = require('drizzle-orm');

const reservationWorker = new Worker('reservation-expiration', async (job) => {
  const { reservationId } = job.data;

  await db.transaction(async (tx) => {
    // 1. Lock reservation row
    const [reservation] = await tx.select().from(reservations)
      .where(eq(reservations.id, reservationId))
      .for('update');

    if (!reservation) {
      console.log(`[ReservationWorker] Reservation ${reservationId} not found, skipping.`);
      return;
    }

    // 2. Verify reservation is active
    if (reservation.status !== 'RESERVED') {
      console.log(`[ReservationWorker] Reservation ${reservationId} is already in status ${reservation.status}, skipping.`);
      return;
    }

    // 3. Lock associated order to verify state
    let orderPaid = false;
    if (reservation.order_id) {
      const [order] = await tx.select().from(orders)
        .where(eq(orders.id, reservation.order_id))
        .for('update');
        
      if (order && order.status === 'PAID') {
        orderPaid = true;
      }
    }

    // 4. Update reservation state safely and handle inventory
    if (orderPaid) {
      // Payment successful, confirm reservation, do NOT release inventory
      await tx.update(reservations)
        .set({ status: 'CONFIRMED_SOLD', updated_at: new Date() })
        .where(eq(reservations.id, reservationId));
        
      console.log(`[ReservationWorker] Reservation ${reservationId} confirmed (Order PAID)`);
    } else {
      // Order not paid or no order, release inventory safely
      const [inv] = await tx.select().from(inventory)
        .where(eq(inventory.variant_id, reservation.variant_id))
        .for('update');

      if (inv) {
        await tx.update(inventory)
          .set({
            available_quantity: sql`${inventory.available_quantity} + ${reservation.quantity}`,
            reserved_quantity: sql`${inventory.reserved_quantity} - ${reservation.quantity}`,
            updated_at: new Date()
          })
          .where(eq(inventory.variant_id, reservation.variant_id));
      }

      await tx.update(reservations)
        .set({ status: 'RELEASED', updated_at: new Date() })
        .where(eq(reservations.id, reservationId));
        
      console.log(`[ReservationWorker] Reservation ${reservationId} released`);
      
      // Cancel order and payment if they exist and are pending
      if (reservation.order_id) {
        const [orderData] = await tx.select().from(orders).where(eq(orders.id, reservation.order_id));
        if (orderData && orderData.status === 'PAYMENT_PENDING') {
          const { transitionOrderStatus } = require('../orders/orders.service');
          try {
            await transitionOrderStatus(orderData.id, 'CANCELED', tx);
            console.log(`[ReservationWorker] Order ${orderData.id} CANCELED due to timeout`);
          } catch (e) {
            console.log(`[ReservationWorker] Could not cancel order: ${e.message}`);
          }
          
          const { payments } = require('../../db/schema');
          await tx.update(payments)
            .set({ status: 'failed', updated_at: new Date() })
            .where(and(eq(payments.order_id, orderData.id), eq(payments.status, 'pending')));
        }
      }
    }
  });
}, { connection });

reservationWorker.on('failed', (job, err) => {
  console.error(`[ReservationWorker] Job ${job.id} failed:`, err);
});

module.exports = reservationWorker;
