const { db } = require('../../db');
const { orders, order_items } = require('../../db/schema');
const { eq } = require('drizzle-orm');
const { requireAdmin } = require('../../middleware/auth');
const { transitionOrderStatus } = require('../orders/orders.service');

module.exports = async function (fastify, opts) {
  fastify.addHook('preHandler', requireAdmin);

  fastify.get('/orders', async (request, reply) => {
    const { payments } = require('../../db/schema');
    const allOrders = await db.select({
      id: orders.id,
      user_id: orders.user_id,
      status: orders.status,
      total_amount: orders.total_amount,
      created_at: orders.created_at,
      payment_provider: payments.provider,
      payment_status: payments.status,
      payment_id: payments.provider_transaction_id
    })
    .from(orders)
    .leftJoin(payments, eq(orders.id, payments.order_id));
    
    // Group payments if there are multiples, but typically one per order
    return { orders: allOrders };
  });

  fastify.get('/orders/:id', async (request, reply) => {
    const { id } = request.params;
    const { payments } = require('../../db/schema');

    const [orderData] = await db.select({
      id: orders.id,
      user_id: orders.user_id,
      status: orders.status,
      total_amount: orders.total_amount,
      courier: orders.courier,
      tracking_number: orders.tracking_number,
      tracking_url: orders.tracking_url,
      shipped_at: orders.shipped_at,
      estimated_delivery_date: orders.estimated_delivery_date,
      delivery_notes: orders.delivery_notes,
      tracking_timeline: orders.tracking_timeline,
      created_at: orders.created_at,
      payment_provider: payments.provider,
      payment_status: payments.status,
      payment_id: payments.provider_transaction_id
    })
    .from(orders)
    .leftJoin(payments, eq(orders.id, payments.order_id))
    .where(eq(orders.id, id))
    .limit(1);

    if (!orderData) {
      return reply.status(404).send({ error: { message: 'Order not found' } });
    }

    const { product_variants, products, users, addresses } = require('../../db/schema');
    const items = await db.select({
      id: order_items.id,
      variant_id: order_items.variant_id,
      quantity: order_items.quantity,
      price_at_time: order_items.price_at_time,
      product_name: products.name,
      variant_size: product_variants.size
    })
    .from(order_items)
    .leftJoin(product_variants, eq(order_items.variant_id, product_variants.id))
    .leftJoin(products, eq(product_variants.product_id, products.id))
    .where(eq(order_items.order_id, orderData.id));

    let customer = { name: 'Guest', email: 'guest' };
    let shipping_address = {};
    if (orderData.user_id) {
      const [user] = await db.select().from(users).where(eq(users.id, orderData.user_id)).limit(1);
      if (user) customer = { name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Customer', email: user.email, phone: user.phone };
      
      const [address] = await db.select().from(addresses).where(eq(addresses.user_id, orderData.user_id)).limit(1);
      if (address) shipping_address = { line1: address.address_line_1, line2: address.address_line_2, city: address.city, state: address.state, zip: address.postal_code, country: address.country };
    }
    
    orderData.customer = customer;
    orderData.shipping_address = shipping_address;

    return { order: orderData, items };
  });

  fastify.post('/orders/:id/cod-collect', async (request, reply) => {
    const { id } = request.params;
    const { payments } = require('../../db/schema');

    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return reply.status(404).send({ error: { message: 'Order not found' }});

    if (['CANCELED', 'FAILED', 'PENDING', 'PAYMENT_PENDING'].includes(order.status)) {
      return reply.status(400).send({ error: { message: 'Order is not in a valid fulfillment state for collection' }});
    }

    const [payment] = await db.select().from(payments).where(eq(payments.order_id, id)).limit(1);
    if (!payment || payment.provider !== 'COD') {
      return reply.status(400).send({ error: { message: 'Not a COD payment' }});
    }

    if (payment.status === 'success') {
      return { message: 'Already collected', payment };
    }

    const [updatedPayment] = await db.update(payments)
      .set({ status: 'success', updated_at: new Date() })
      .where(eq(payments.id, payment.id))
      .returning();

    return { message: 'COD payment collected', payment: updatedPayment };
  });

  // Admin endpoint strictly to test transitions (usually this is done automatically via webhooks or admin actions)
  fastify.post('/orders/:id/transition', async (request, reply) => {
    const { id } = request.params;
    const { status } = request.body;

    if (!status) return reply.status(400).send({ error: { message: 'Status is required' }});

    try {
      const order = await transitionOrderStatus(id, status);
      return { order };
    } catch (err) {
      return reply.status(400).send({ error: { message: err.message } });
    }
  });

  // Tracking API
  fastify.patch('/orders/:id/tracking', async (request, reply) => {
    const { id } = request.params;
    const { courier, tracking_number, tracking_url, estimated_delivery_date, delivery_notes, event } = request.body;

    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) {
      return reply.status(404).send({ error: { message: 'Order not found' } });
    }

    const updates = { updated_at: new Date() };
    if (courier !== undefined) updates.courier = courier;
    if (tracking_number !== undefined) updates.tracking_number = tracking_number;
    if (tracking_url !== undefined) updates.tracking_url = tracking_url;
    if (estimated_delivery_date !== undefined) updates.estimated_delivery_date = new Date(estimated_delivery_date);
    if (delivery_notes !== undefined) updates.delivery_notes = delivery_notes;

    if (order.status === 'PROCESSING' && (tracking_number || courier)) {
      // Auto transition to SHIPPED if adding tracking details while processing
      try {
         await transitionOrderStatus(id, 'SHIPPED');
         updates.shipped_at = new Date();
      } catch(e) {}
    }

    if (event) {
      const timeline = order.tracking_timeline || [];
      timeline.push({ status: event, date: new Date().toISOString() });
      updates.tracking_timeline = timeline;
    }

    const [updatedOrder] = await db.update(orders).set(updates).where(eq(orders.id, id)).returning();
    return { order: updatedOrder };
  });
};
