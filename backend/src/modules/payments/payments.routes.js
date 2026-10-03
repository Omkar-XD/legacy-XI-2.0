const { db } = require('../../db');
const { orders, payments, reservations } = require('../../db/schema');
const { eq, and } = require('drizzle-orm');
const { requireAuth } = require('../../middleware/auth');
const env = require('../../config/env');
const { createRazorpayOrder, verifyRazorpaySignature } = require('./razorpay.service');
const { createStripeSession } = require('./stripe.service');
const { transitionOrderStatus } = require('../orders/orders.service');

module.exports = async function (fastify, opts) {
  fastify.addHook('preHandler', requireAuth);

  fastify.post('/create', async (request, reply) => {
    const userId = request.user.id;
    const { order_id, provider } = request.body;

    if (!order_id || !provider) {
      return reply.status(400).send({ error: { message: 'Order ID and provider are required' } });
    }

    if (!['razorpay', 'stripe', 'COD'].includes(provider)) {
      return reply.status(400).send({ error: { message: 'Invalid provider' } });
    }

    // Fetch order to verify ownership and state
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, order_id), eq(orders.user_id, userId)))
      .limit(1);

    if (!order) {
      return reply.status(404).send({ error: { message: 'Order not found' } });
    }

    if (order.status !== 'PAYMENT_PENDING') {
      return reply.status(400).send({ error: { message: 'Order is not pending payment' } });
    }

    try {
      let providerTxId = null;
      let clientSecret = null;

      if (provider === 'razorpay') {
        const rpOrder = await createRazorpayOrder(order.total_amount, order.id);
        providerTxId = rpOrder.id;
        clientSecret = rpOrder.id;
      } else if (provider === 'stripe') {
        const successUrl = `${env.FRONTEND_URL}/checkout/success?order_id=${order.id}`;
        const cancelUrl = `${env.FRONTEND_URL}/checkout/cancel?order_id=${order.id}`;
        const session = await createStripeSession(order.total_amount, order.id, successUrl, cancelUrl);
        providerTxId = session.id;
        clientSecret = session.url; // for stripe we return the checkout URL
      } else if (provider === 'COD') {
        // Transition order to PROCESSING (valid fulfillment state)
        await transitionOrderStatus(order.id, 'PROCESSING');
        
        // Mark reservations as confirmed
        await db.update(reservations)
          .set({ status: 'CONFIRMED_SOLD', updated_at: new Date() })
          .where(eq(reservations.order_id, order.id));
          
        providerTxId = `cod_${order.id}`; // dummy tx ID for COD
        clientSecret = null;
      }

      // Record payment attempt in our DB
      await db.insert(payments).values({
        order_id: order.id,
        provider,
        provider_transaction_id: providerTxId,
        amount: order.total_amount,
        status: 'pending'
      });

      return {
        message: 'Payment initialized',
        provider,
        clientSecret,
        provider_transaction_id: providerTxId,
        amount: order.total_amount
      };

    } catch (err) {
      fastify.log.error(err, 'Payment Provider Error');
      return reply.status(502).send({ error: { message: 'Failed to initialize payment with provider' } });
    }
  });

  // Safe client-side verification helper (NOT marking order as PAID)
  fastify.post('/verify/razorpay', async (request, reply) => {
    const { order_id, payment_id, signature } = request.body;
    
    if (!order_id || !payment_id || !signature) {
      return reply.status(400).send({ error: { message: 'Missing razorpay parameters' } });
    }

    const isValid = verifyRazorpaySignature(order_id, payment_id, signature);

    if (isValid) {
      // NOTE: We only update the payment record, we DO NOT mark the order as PAID.
      // Order state is strictly reserved for the webhook endpoint (Phase 10).
      await db.update(payments)
        .set({ status: 'success', updated_at: new Date() })
        .where(eq(payments.provider_transaction_id, order_id));

      return { verified: true, message: 'Signature is valid. Waiting for webhook confirmation.' };
    } else {
      await db.update(payments)
        .set({ status: 'failed', updated_at: new Date() })
        .where(eq(payments.provider_transaction_id, order_id));

      return reply.status(400).send({ error: { message: 'Invalid payment signature' } });
    }
  });
};
