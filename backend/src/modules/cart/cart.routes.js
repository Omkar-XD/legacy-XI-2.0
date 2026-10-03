const { db } = require('../../db');
const { carts, cart_items, product_variants, products, inventory } = require('../../db/schema');
const { eq, and } = require('drizzle-orm');
const { requireAuth } = require('../../middleware/auth');
const { addItemSchema, updateItemSchema } = require('./cart.schema');

module.exports = async function (fastify, opts) {
  fastify.addHook('preHandler', requireAuth);

  // Helper to get or create cart for user
  const getOrCreateCart = async (userId) => {
    let [cart] = await db.select().from(carts).where(eq(carts.user_id, userId)).limit(1);
    if (!cart) {
      [cart] = await db.insert(carts).values({ user_id: userId }).returning();
    }
    return cart;
  };

  fastify.get('/', async (request, reply) => {
    const cart = await getOrCreateCart(request.user.id);
    
    const { product_media } = require('../../db/schema');
    const { asc } = require('drizzle-orm');

    const items = await db
      .select({
        id: cart_items.id,
        cart_id: cart_items.cart_id,
        variant_id: cart_items.variant_id,
        quantity: cart_items.quantity,
        sku: product_variants.sku,
        size: product_variants.size,
        color: product_variants.color,
        price_override: product_variants.price_override,
        base_price: products.base_price,
        product_name: products.name,
        product_id: products.id,
        available_quantity: inventory.available_quantity,
      })
      .from(cart_items)
      .innerJoin(product_variants, eq(cart_items.variant_id, product_variants.id))
      .innerJoin(products, eq(product_variants.product_id, products.id))
      .innerJoin(inventory, eq(product_variants.id, inventory.variant_id))
      .where(eq(cart_items.cart_id, cart.id));

    // Calculate totals securely on backend
    let cartTotal = 0;
    const formattedItems = await Promise.all(items.map(async (item) => {
      const price = item.price_override !== null ? item.price_override : item.base_price;
      const subtotal = price * item.quantity;
      cartTotal += subtotal;

      // Fetch first image for this product
      const [media] = await db.select().from(product_media).where(eq(product_media.product_id, item.product_id)).orderBy(asc(product_media.sort_order)).limit(1);
      
      return {
        id: item.id,
        variant_id: item.variant_id,
        sku: item.sku,
        name: item.product_name,
        product_id: item.product_id,
        size: item.size,
        color: item.color,
        price,
        quantity: item.quantity,
        subtotal,
        image: media ? media.url : '',
        in_stock: item.available_quantity >= item.quantity,
        available_quantity: item.available_quantity
      };
    }));

    return {
      cart: {
        id: cart.id,
        items: formattedItems,
        total: cartTotal
      }
    };
  });

  fastify.post('/items', async (request, reply) => {
    const parsed = addItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { message: 'Validation error', details: parsed.error.format() } });
    }
    const { variant_id, quantity } = parsed.data;

    const cart = await getOrCreateCart(request.user.id);

    // Verify variant and check inventory
    const [inv] = await db.select().from(inventory).where(eq(inventory.variant_id, variant_id)).limit(1);
    if (!inv) {
      return reply.status(404).send({ error: { message: 'Variant not found' } });
    }

    if (inv.available_quantity < quantity) {
      return reply.status(400).send({ error: { message: 'Insufficient stock available' } });
    }

    // Check if already in cart
    const [existingItem] = await db.select()
      .from(cart_items)
      .where(and(eq(cart_items.cart_id, cart.id), eq(cart_items.variant_id, variant_id)))
      .limit(1);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (inv.available_quantity < newQuantity) {
        return reply.status(400).send({ error: { message: 'Insufficient stock available for combined quantity' } });
      }
      
      const [updatedItem] = await db.update(cart_items)
        .set({ quantity: newQuantity, updated_at: new Date() })
        .where(eq(cart_items.id, existingItem.id))
        .returning();
      return reply.send({ item: updatedItem });
    } else {
      const [newItem] = await db.insert(cart_items)
        .values({
          cart_id: cart.id,
          variant_id,
          quantity
        })
        .returning();
      return reply.status(201).send({ item: newItem });
    }
  });

  fastify.patch('/items/:id', async (request, reply) => {
    const { id } = request.params;
    const parsed = updateItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { message: 'Validation error', details: parsed.error.format() } });
    }
    const { quantity } = parsed.data;

    const cart = await getOrCreateCart(request.user.id);

    // Verify item belongs to cart
    const [item] = await db.select().from(cart_items).where(and(eq(cart_items.id, id), eq(cart_items.cart_id, cart.id))).limit(1);
    if (!item) {
      return reply.status(404).send({ error: { message: 'Cart item not found' } });
    }

    // Verify inventory limit
    const [inv] = await db.select().from(inventory).where(eq(inventory.variant_id, item.variant_id)).limit(1);
    if (inv && inv.available_quantity < quantity) {
      return reply.status(400).send({ error: { message: 'Insufficient stock available' } });
    }

    const [updatedItem] = await db.update(cart_items)
      .set({ quantity, updated_at: new Date() })
      .where(eq(cart_items.id, id))
      .returning();

    return reply.send({ item: updatedItem });
  });

  fastify.delete('/items/:id', async (request, reply) => {
    const { id } = request.params;
    const cart = await getOrCreateCart(request.user.id);
    
    await db.delete(cart_items)
      .where(and(eq(cart_items.id, id), eq(cart_items.cart_id, cart.id)));
      
    // Idempotent: return 200 even if already deleted
    return reply.send({ message: 'Item removed from cart' });
  });

  fastify.delete('/', async (request, reply) => {
    const cart = await getOrCreateCart(request.user.id);
    await db.delete(cart_items).where(eq(cart_items.cart_id, cart.id));
    return reply.send({ message: 'Cart cleared' });
  });
};
