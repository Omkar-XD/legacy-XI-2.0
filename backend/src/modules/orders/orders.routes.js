const { db } = require('../../db');
const { orders, order_items } = require('../../db/schema');
const { eq, and } = require('drizzle-orm');
const { requireAuth } = require('../../middleware/auth');

module.exports = async function (fastify, opts) {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/', async (request, reply) => {
    const userId = request.user.id;
    const { payments } = require('../../db/schema');
    const { ne } = require('drizzle-orm');
    const userOrders = await db.select({
      id: orders.id,
      status: orders.status,
      total_amount: orders.total_amount,
      created_at: orders.created_at,
      payment_provider: payments.provider,
      payment_status: payments.status
    })
    .from(orders)
    .leftJoin(payments, eq(orders.id, payments.order_id))
    .where(and(eq(orders.user_id, userId), ne(orders.status, 'CANCELED')));
    return { orders: userOrders };
  });

  fastify.get('/:id', async (request, reply) => {
    const userId = request.user.id;
    const { id } = request.params;
    const { payments } = require('../../db/schema');

    const [orderData] = await db
      .select({
        id: orders.id,
        status: orders.status,
        total_amount: orders.total_amount,
        created_at: orders.created_at,
        courier: orders.courier,
        tracking_number: orders.tracking_number,
        tracking_url: orders.tracking_url,
        payment_provider: payments.provider,
        payment_status: payments.status,
        payment_id: payments.provider_transaction_id
      })
      .from(orders)
      .leftJoin(payments, eq(orders.id, payments.order_id))
      .where(and(eq(orders.id, id), eq(orders.user_id, userId)))
      .limit(1);

    if (!orderData) {
      return reply.status(404).send({ error: { message: 'Order not found' } });
    }

    const items = await db
      .select()
      .from(order_items)
      .where(eq(order_items.order_id, orderData.id));

    return { order: orderData, items };
  });

  fastify.get('/:id/tracking', async (request, reply) => {
    const userId = request.user.id;
    const { id } = request.params;

    const [order] = await db
      .select({
        id: orders.id,
        status: orders.status,
        courier: orders.courier,
        tracking_number: orders.tracking_number,
        tracking_url: orders.tracking_url,
        shipped_at: orders.shipped_at,
        estimated_delivery_date: orders.estimated_delivery_date,
        delivery_notes: orders.delivery_notes,
        tracking_timeline: orders.tracking_timeline
      })
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.user_id, userId)))
      .limit(1);

    if (!order) {
      return reply.status(404).send({ error: { message: 'Order not found' } });
    }

    return { tracking: order };
  });

  fastify.post('/:id/cancel', async (request, reply) => {
    const userId = request.user.id;
    const { id } = request.params;
    const { payments, inventory, reservations, sql } = require('../../db/schema');
    const { transitionOrderStatus } = require('./orders.service');

    // Verify order belongs to user and is in a cancelable state
    const [orderData] = await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.user_id, userId))).limit(1);
    if (!orderData) {
      return reply.status(404).send({ error: { message: 'Order not found' } });
    }

    if (!['PENDING', 'PAYMENT_PENDING', 'PROCESSING'].includes(orderData.status)) {
      return reply.status(400).send({ error: { message: 'Order cannot be canceled at this stage' } });
    }

    try {
      await db.transaction(async (tx) => {
        // 1. Transition order state
        await transitionOrderStatus(id, 'CANCELED', tx);
        
        // 2. Mark payment as failed/canceled if pending
        const [paymentData] = await tx.select().from(payments).where(eq(payments.order_id, id));
        if (paymentData && paymentData.status === 'pending') {
          await tx.update(payments).set({ status: 'failed', updated_at: new Date() }).where(eq(payments.id, paymentData.id));
        }

        // 3. Release reservations back to inventory
        const resList = await tx.update(reservations)
          .set({ status: 'RELEASED', updated_at: new Date() })
          .where(eq(reservations.order_id, id))
          .returning();
          
        for (const res of resList) {
          const { sql: dSql } = require('drizzle-orm');
          await tx.update(inventory)
            .set({
              available_quantity: dSql`${inventory.available_quantity} + ${res.quantity}`,
              reserved_quantity: dSql`${inventory.reserved_quantity} - ${res.quantity}`,
              updated_at: new Date()
            })
            .where(eq(inventory.variant_id, res.variant_id));
        }
      });
      return { message: 'Order canceled successfully' };
    } catch (err) {
      return reply.status(400).send({ error: { message: err.message } });
    }
  });
};
