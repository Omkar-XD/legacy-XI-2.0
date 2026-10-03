const { db } = require('../../db');
const { carts, cart_items, products, product_variants, inventory, orders, order_items, reservations } = require('../../db/schema');
const { eq, inArray, and, sql } = require('drizzle-orm');
const { requireAuth } = require('../../middleware/auth');

module.exports = async function (fastify, opts) {
  fastify.addHook('preHandler', requireAuth);

  fastify.post('/', async (request, reply) => {
    const userId = request.user.id;

    // We do all checkout logic inside a single transaction
    try {
      const orderData = await db.transaction(async (tx) => {
        // 1. Fetch user cart
        const [cart] = await tx.select().from(carts).where(eq(carts.user_id, userId)).limit(1);
        if (!cart) {
          throw new Error('Cart is empty');
        }

        // 2. Fetch cart items
        const items = await tx.select({
          cart_item_id: cart_items.id,
          variant_id: cart_items.variant_id,
          quantity: cart_items.quantity
        }).from(cart_items).where(eq(cart_items.cart_id, cart.id));

        if (items.length === 0) {
          throw new Error('Cart is empty');
        }

        // 3. Sort variant_ids deterministically
        const sortedItems = [...items].sort((a, b) => a.variant_id.localeCompare(b.variant_id));
        const variantIds = sortedItems.map(i => i.variant_id);

        // 4. Lock inventory rows & get authoritative pricing in the same tx
        // To avoid deadlocks, we lock one by one in deterministic order
        const lockedInventoryAndPricing = {};
        for (const item of sortedItems) {
          // Verify variant existence and fetch pricing
          const [variantData] = await tx.select({
            id: product_variants.id,
            price_override: product_variants.price_override,
            base_price: products.base_price
          })
          .from(product_variants)
          .innerJoin(products, eq(product_variants.product_id, products.id))
          .where(eq(product_variants.id, item.variant_id))
          .limit(1);

          if (!variantData) {
            throw new Error(`Variant ${item.variant_id} is invalid`);
          }

          // Lock inventory row
          const [inv] = await tx.select()
            .from(inventory)
            .where(eq(inventory.variant_id, item.variant_id))
            .for('update');

          if (!inv) {
            throw new Error(`Inventory record not found for variant ${item.variant_id}`);
          }

          // 5. Verify stock
          if (inv.available_quantity < item.quantity) {
            throw new Error(`Insufficient stock for variant ${item.variant_id}`);
          }

          const price = variantData.price_override !== null ? variantData.price_override : variantData.base_price;

          lockedInventoryAndPricing[item.variant_id] = {
            inventory: inv,
            price: price
          };
        }

        // 6. Calculate total
        let totalAmount = 0;
        for (const item of sortedItems) {
          totalAmount += lockedInventoryAndPricing[item.variant_id].price * item.quantity;
        }

        // 7. Create order
        const [order] = await tx.insert(orders).values({
          user_id: userId,
          status: 'PAYMENT_PENDING',
          total_amount: totalAmount,
        }).returning();

        // 8. Create order items, update inventory, create reservations
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 15); // 15 mins expiration

        const createdReservations = [];

        for (const item of sortedItems) {
          const price = lockedInventoryAndPricing[item.variant_id].price;
          
          await tx.insert(order_items).values({
            order_id: order.id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            price_at_time: price
          });

          await tx.update(inventory)
            .set({
              available_quantity: sql`${inventory.available_quantity} - ${item.quantity}`,
              reserved_quantity: sql`${inventory.reserved_quantity} + ${item.quantity}`,
              updated_at: new Date()
            })
            .where(eq(inventory.variant_id, item.variant_id));

          const [res] = await tx.insert(reservations).values({
            variant_id: item.variant_id,
            cart_id: cart.id,
            order_id: order.id,
            quantity: item.quantity,
            status: 'RESERVED',
            expires_at: expirationTime
          }).returning();

          // Will push delayed job outside tx context so we don't hold the connection
          // We will store res.id in a temporary array
          createdReservations.push(res.id);
        }

        // 9. Clear cart
        await tx.delete(cart_items).where(eq(cart_items.cart_id, cart.id));

        return { order, createdReservations };
      });

      // 10. Enqueue delayed jobs to BullMQ (Outside the DB Transaction to prevent I/O blocking)
      const { reservationQueue } = require('../workers/queues');
      for (const resId of orderData.createdReservations) {
        await reservationQueue.add('expire-reservation', { reservationId: resId }, {
          jobId: `expire-res-${resId}`, // Idempotency protection
          delay: 15 * 60 * 1000 // 15 mins delay
        });
      }

      return reply.send({
        message: 'Checkout successful, ready for payment',
        order: {
          id: orderData.order.id,
          total_amount: orderData.order.total_amount,
          status: orderData.order.status
        }
      });
    } catch (error) {
      if (error.message.includes('Cart is empty') || error.message.includes('Insufficient stock') || error.message.includes('invalid')) {
        return reply.status(400).send({ error: { message: error.message } });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: { message: 'Internal Server Error' } });
    }
  });
};
