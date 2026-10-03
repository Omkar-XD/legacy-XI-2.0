const { db } = require('../../db');
const { processed_webhook_events } = require('../../db/schema');
const { eq } = require('drizzle-orm');
const crypto = require('crypto');
const env = require('../../config/env');
const { stripe } = require('./stripe.service');
const { paymentQueue } = require('../workers/queues');

module.exports = async function (fastify, opts) {
  
  // Custom parser to keep raw body as a buffer for signature verification
  fastify.addContentTypeParser('application/json', { parseAs: 'buffer' }, function (req, body, done) {
    try {
      const json = JSON.parse(body.toString());
      req.rawBody = body; // Attach raw buffer for stripe
      done(null, json);
    } catch (err) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });

  fastify.post('/razorpay/webhook', async (request, reply) => {
    const signature = request.headers['x-razorpay-signature'];
    const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return reply.status(400).send({ error: 'Missing signature or secret' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(request.rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return reply.status(400).send({ error: 'Invalid signature' });
    }

    const event = request.body;
    const eventId = request.headers['x-razorpay-event-id'] || event.id; // razorpay sends header sometimes, else in body
    const eventType = event.event;

    // Idempotency check
    const [existing] = await db.select().from(processed_webhook_events).where(eq(processed_webhook_events.event_id, eventId));
    if (existing) {
      return reply.send({ received: true, message: 'Already processed' });
    }

    // Insert idempotency record
    await db.insert(processed_webhook_events).values({
      provider: 'razorpay',
      event_id: eventId
    });

    // Enqueue
    await paymentQueue.add('process-razorpay-webhook', { provider: 'razorpay', eventId, payload: event }, { jobId: eventId });

    return reply.send({ received: true });
  });

  fastify.post('/stripe/webhook', async (request, reply) => {
    const signature = request.headers['stripe-signature'];
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(request.rawBody, signature, webhookSecret);
    } catch (err) {
      fastify.log.error(err, 'Stripe signature error');
      return reply.status(400).send({ error: 'Invalid signature' });
    }

    const eventId = event.id;
    const eventType = event.type;

    // Idempotency check
    const [existing] = await db.select().from(processed_webhook_events).where(eq(processed_webhook_events.event_id, eventId));
    if (existing) {
      return reply.send({ received: true, message: 'Already processed' });
    }

    // Insert idempotency record
    await db.insert(processed_webhook_events).values({
      provider: 'stripe',
      event_id: eventId
    });

    // Enqueue
    await paymentQueue.add('process-stripe-webhook', { provider: 'stripe', eventId, payload: event }, { jobId: eventId });

    return reply.send({ received: true });
  });
};
