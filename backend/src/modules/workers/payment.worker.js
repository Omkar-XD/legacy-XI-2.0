const { Worker } = require('bullmq');
const { connection } = require('./queues');
const { db } = require('../../db');
const { payments, orders, reservations, inventory } = require('../../db/schema');
const { eq, sql } = require('drizzle-orm');
const { transitionOrderStatus } = require('../orders/orders.service');

const paymentWorker = new Worker('payment-webhooks', async (job) => {
  const { provider, eventId, payload } = job.data;
  console.log(`[PaymentWorker] Processing webhook from ${provider}, event: ${eventId}`);

  let internalStatus = null;
  let providerTxId = null;
  let providerAmount = null; // in cents!

  if (provider === 'razorpay') {
    if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
      internalStatus = 'success';
      providerTxId = payload.payload?.payment?.entity?.order_id || payload.payload?.order?.entity?.id;
      // Razorpay provides amount in cents/paise
      providerAmount = payload.payload?.payment?.entity?.amount;
    } else if (payload.event === 'payment.failed') {
      internalStatus = 'failed';
      providerTxId = payload.payload?.payment?.entity?.order_id;
    }
  } else if (provider === 'stripe') {
    if (payload.type === 'checkout.session.completed') {
      internalStatus = 'success';
      providerTxId = payload.data.object.id;
      providerAmount = payload.data.object.amount_total;
    } else if (payload.type === 'checkout.session.async_payment_failed') {
      internalStatus = 'failed';
      providerTxId = payload.data.object.id;
    }
  }

  if (!internalStatus || !providerTxId) {
    console.log(`[PaymentWorker] Unhandled or unknown event type for event ${eventId}, skipping.`);
    return;
  }

  // 1. Fetch the payment mapping to find internal order_id
  const [paymentRecord] = await db.select().from(payments).where(eq(payments.provider_transaction_id, providerTxId)).limit(1);

  if (!paymentRecord) {
    console.error(`[PaymentWorker] Payment record not found for provider_transaction_id: ${providerTxId}`);
    throw new Error(`Payment record not found for provider_transaction_id: ${providerTxId}`);
  }

  // 2. Amount Validation (if successful payment)
  if (internalStatus === 'success' && providerAmount !== null) {
    if (paymentRecord.amount !== providerAmount) {
      console.error(`[PaymentWorker] SECURITY ALERT: Amount mismatch for event ${eventId}, provider ${provider}. Expected: ${paymentRecord.amount}, Received: ${providerAmount}. Aborting fulfillment.`);
      return; // Do NOT process!
    }
  }

  // 3. State transition processing
  await db.transaction(async (tx) => {
    // Lock the payment
    const [lockedPayment] = await tx.select().from(payments).where(eq(payments.id, paymentRecord.id)).for('update');
    
    if (lockedPayment.status === 'success' || lockedPayment.status === 'failed') {
       console.log(`[PaymentWorker] Payment ${lockedPayment.id} already processed (${lockedPayment.status}), skipping duplicate business transition.`);
       return;
    }

    // Update Payment row
    await tx.update(payments)
      .set({ status: internalStatus, updated_at: new Date() })
      .where(eq(payments.id, paymentRecord.id));

    // Update Order row via state machine
    if (internalStatus === 'success') {
      try {
        await transitionOrderStatus(lockedPayment.order_id, 'PAID', tx);
        
        // Mark reservations as confirmed
        await tx.update(reservations)
          .set({ status: 'CONFIRMED_SOLD', updated_at: new Date() })
          .where(eq(reservations.order_id, lockedPayment.order_id));
          
        console.log(`[PaymentWorker] Order ${lockedPayment.order_id} marked PAID and Inventory Confirmed.`);
      } catch (err) {
        console.log(`[PaymentWorker] Order state machine warning: ${err.message}`);
      }
    } else if (internalStatus === 'failed') {
      try {
        await transitionOrderStatus(lockedPayment.order_id, 'FAILED', tx);
        
        // Release reservations & restore inventory
        const resList = await tx.update(reservations)
          .set({ status: 'RELEASED', updated_at: new Date() })
          .where(eq(reservations.order_id, lockedPayment.order_id))
          .returning();
          
        for (const res of resList) {
          await tx.update(inventory)
            .set({
              available_quantity: sql`${inventory.available_quantity} + ${res.quantity}`,
              reserved_quantity: sql`${inventory.reserved_quantity} - ${res.quantity}`,
              updated_at: new Date()
            })
            .where(eq(inventory.variant_id, res.variant_id));
        }

        console.log(`[PaymentWorker] Order ${lockedPayment.order_id} marked FAILED and Inventory Released.`);
      } catch (err) {
        console.log(`[PaymentWorker] Order state machine warning: ${err.message}`);
      }
    }
  });

}, { connection, concurrency: 5 });

paymentWorker.on('failed', (job, err) => {
  console.error(`[PaymentWorker] Job ${job.id} failed:`, err);
});

paymentWorker.on('completed', (job) => {
  console.log(`[PaymentWorker] Job ${job.id} completed successfully.`);
});

module.exports = paymentWorker;
