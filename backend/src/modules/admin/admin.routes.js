const { db } = require('../../db');
const { categories, products, product_variants, inventory, product_media } = require('../../db/schema');
const { eq } = require('drizzle-orm');
const { requireAdmin } = require('../../middleware/auth');
const { createProductSchema, updateProductSchema, createVariantSchema, updateVariantSchema } = require('./admin.schema');

module.exports = async function (fastify, opts) {
  fastify.addHook('preHandler', requireAdmin);

  fastify.post('/categories', async (request, reply) => {
    const { name, slug } = request.body;
    if (!name || !slug) return reply.status(400).send({ error: { message: 'Name and slug required' }});
    const [cat] = await db.insert(categories).values({ name, slug }).returning();
    return reply.status(201).send({ category: cat });
  });

  fastify.patch('/categories/:id', async (request, reply) => {
    const { id } = request.params;
    const { name, slug } = request.body;
    const [cat] = await db.update(categories).set({ name, slug, updated_at: new Date() }).where(eq(categories.id, id)).returning();
    if (!cat) return reply.status(404).send({ error: { message: 'Category not found' }});
    return { category: cat };
  });

  fastify.delete('/categories/:id', async (request, reply) => {
    const { id } = request.params;
    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
    if (!deleted) return reply.status(404).send({ error: { message: 'Category not found' }});
    return { message: 'Category deleted' };
  });

  fastify.post('/products', async (request, reply) => {
    const parsed = createProductSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { message: 'Validation error', details: parsed.error.format() } });
    }

    try {
      const { category_ids, ...productData } = parsed.data;
      const [newProduct] = await db.insert(products).values(productData).returning();
      
      const { product_categories } = require('../../db/schema');
      const categoryInserts = category_ids.map(cid => ({
        product_id: newProduct.id,
        category_id: cid
      }));
      await db.insert(product_categories).values(categoryInserts);
      
      return reply.status(201).send({ product: newProduct });
    } catch (error) {
      if (error.code === '23505' || (error.cause && error.cause.code === '23505')) {
        return reply.status(400).send({ error: { message: 'A product with this slug already exists.' } });
      }
      throw error;
    }
  });

  fastify.get('/products', async (request, reply) => {
    const { desc, asc } = require('drizzle-orm');
    const { product_categories } = require('../../db/schema');
    const allProducts = await db.select().from(products).orderBy(desc(products.created_at));
    
    const allVariants = await db.select().from(product_variants);
    const allInventory = await db.select().from(inventory);
    const allMedia = await db.select().from(product_media).orderBy(asc(product_media.sort_order));
    const allProductCategories = await db.select().from(product_categories);

    const result = allProducts.map(p => {
      const vars = allVariants.filter(v => v.product_id === p.id).map(v => {
        const inv = allInventory.find(i => i.variant_id === v.id);
        return { ...v, available_quantity: inv ? inv.available_quantity : 0 };
      });
      const med = allMedia.filter(m => m.product_id === p.id);
      const catIds = allProductCategories.filter(pc => pc.product_id === p.id).map(pc => pc.category_id);
      return { ...p, variants: vars, media: med, category_ids: catIds };
    });

    return { products: result };
  });

  fastify.get('/products/:id', async (request, reply) => {
    const { id } = request.params;
    const { asc } = require('drizzle-orm');
    
    const productResult = await db.select().from(products).where(eq(products.id, id)).limit(1);
    const product = productResult[0];
    if (!product) return reply.status(404).send({ error: { message: 'Product not found' } });
    
    const variants = await db
      .select({
        id: product_variants.id,
        sku: product_variants.sku,
        size: product_variants.size,
        color: product_variants.color,
        price_override: product_variants.price_override,
        available_quantity: inventory.available_quantity,
        reserved_quantity: inventory.reserved_quantity,
      })
      .from(product_variants)
      .leftJoin(inventory, eq(product_variants.id, inventory.variant_id))
      .where(eq(product_variants.product_id, id));

    const media = await db.select().from(product_media).where(eq(product_media.product_id, id)).orderBy(asc(product_media.sort_order));

    return { product, variants, media };
  });
  fastify.patch('/products/:id', async (request, reply) => {
    const { id } = request.params;
    const parsed = updateProductSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { message: 'Validation error', details: parsed.error.format() } });
    }

    try {
      const { category_ids, ...updateData } = parsed.data;

      let updatedProduct = null;
      if (Object.keys(updateData).length > 0) {
        const [res] = await db.update(products).set({
          ...updateData,
          updated_at: new Date()
        }).where(eq(products.id, id)).returning();
        updatedProduct = res;
      } else {
        const [res] = await db.select().from(products).where(eq(products.id, id)).limit(1);
        updatedProduct = res;
      }

      if (!updatedProduct) return reply.status(404).send({ error: { message: 'Product not found' } });

      if (category_ids && category_ids.length > 0) {
        const { product_categories } = require('../../db/schema');
        // Delete old categories
        await db.delete(product_categories).where(eq(product_categories.product_id, id));
        // Insert new ones
        const categoryInserts = category_ids.map(cid => ({
          product_id: id,
          category_id: cid
        }));
        await db.insert(product_categories).values(categoryInserts);
      }

      return { product: updatedProduct };
    } catch (error) {
      if (error.code === '23505' || (error.cause && error.cause.code === '23505')) {
        return reply.status(400).send({ error: { message: 'A product with this slug already exists.' } });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: { message: 'Failed to update product' } });
    }
  });

  fastify.delete('/products/:id', async (request, reply) => {
    const { id } = request.params;
    const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();
    if (!deleted) return reply.status(404).send({ error: { message: 'Product not found' } });
    return { message: 'Product deleted' };
  });

  fastify.post('/products/:id/variants', async (request, reply) => {
    const { id } = request.params;
    const parsed = createVariantSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { message: 'Validation error', details: parsed.error.format() } });
    }

    try {
      // Insert variant
      const [newVariant] = await db.insert(product_variants).values({
        product_id: id,
        sku: parsed.data.sku,
        size: parsed.data.size,
        color: parsed.data.color,
        price_override: parsed.data.price_override,
      }).returning();

      // Insert inventory row
      const [newInventory] = await db.insert(inventory).values({
        variant_id: newVariant.id,
        available_quantity: parsed.data.available_quantity,
        reserved_quantity: 0
      }).returning();

      return reply.status(201).send({ variant: newVariant, inventory: newInventory });
    } catch (error) {
      if (error.code === '23505' || (error.cause && error.cause.code === '23505')) {
        return reply.status(400).send({ error: { message: 'A variant with this SKU already exists.' } });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: { message: 'Failed to add variant' } });
    }
  });

  fastify.patch('/variants/:id', async (request, reply) => {
    const { id } = request.params;
    const parsed = updateVariantSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { message: 'Validation error', details: parsed.error.format() } });
    }

    try {
      const updates = {};
      if (parsed.data.sku !== undefined) updates.sku = parsed.data.sku;
      if (parsed.data.size !== undefined) updates.size = parsed.data.size;
      if (parsed.data.color !== undefined) updates.color = parsed.data.color;
      if (parsed.data.price_override !== undefined) updates.price_override = parsed.data.price_override;

      let updatedVariant = null;
      if (Object.keys(updates).length > 0) {
        const [res] = await db.update(product_variants).set({
          ...updates,
          updated_at: new Date()
        }).where(eq(product_variants.id, id)).returning();
        updatedVariant = res;
        if (!updatedVariant) return reply.status(404).send({ error: { message: 'Variant not found' } });
      }

      if (parsed.data.available_quantity !== undefined) {
        await db.update(inventory).set({
          available_quantity: parsed.data.available_quantity,
          updated_at: new Date()
        }).where(eq(inventory.variant_id, id));
      }

      return { message: 'Variant updated successfully' };
    } catch (error) {
      if (error.code === '23505' || (error.cause && error.cause.code === '23505')) {
        return reply.status(400).send({ error: { message: 'A variant with this SKU already exists.' } });
      }
      fastify.log.error(error);
      return reply.status(500).send({ error: { message: 'Failed to update variant' } });
    }
  });

  fastify.get('/customers', async (request, reply) => {
    const { users, orders } = require('../../db/schema');
    const { desc } = require('drizzle-orm');
    
    // Simple fetch for now - in production use aggregation
    const allUsers = await db.select().from(users).orderBy(desc(users.created_at));
    const allOrders = await db.select().from(orders);

    // Filter out guest users (no password) and auto-generated test accounts
    const realUsers = allUsers.filter(u => {
      if (!u.password_hash) return false; // Hide true guests
      if (u.email && u.email.includes('@test.com')) return false; // Hide test accounts
      return true;
    });

    const customers = realUsers.map(user => {
      const userOrders = allOrders.filter(o => o.user_id === user.id);
      const ordersCount = userOrders.length;
      const totalSpent = userOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      
      return {
        id: user.id,
        name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Unnamed User',
        email: user.email,
        ordersCount,
        totalSpent,
        status: user.role === 'banned' ? 'BANNED' : 'ACTIVE', // simplistic mapping
        avatar_url: user.avatar_url,
        createdAt: user.created_at
      };
    });

    return { customers };
  });
};
