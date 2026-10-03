const { db } = require('../../db');
const { categories, products, product_variants, inventory, product_media } = require('../../db/schema');
const { productQuerySchema, searchSchema } = require('./catalog.schema');
const { eq, ilike, or, desc, asc } = require('drizzle-orm');

module.exports = async function (fastify, opts) {
  fastify.get('/categories', async (request, reply) => {
    const allCategories = await db.select().from(categories);
    return { categories: allCategories };
  });

  fastify.get('/products', async (request, reply) => {
    const parsed = productQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: { message: 'Validation error', details: parsed.error.format() } });
    }
    const { limit, offset, category_id, sort } = parsed.data;

    const { inArray, exists, sql } = require('drizzle-orm');
    let query = db.select().from(products);
    
    if (category_id) {
      const { product_categories } = require('../../db/schema');
      query = query.where(
        exists(
          db.select()
            .from(product_categories)
            .where(
              sql`${product_categories.product_id} = ${products.id} AND ${product_categories.category_id} = ${category_id}`
            )
        )
      );
    }
    
    if (sort === 'newest') query = query.orderBy(desc(products.created_at));
    if (sort === 'price_asc') query = query.orderBy(asc(products.base_price));
    if (sort === 'price_desc') query = query.orderBy(desc(products.base_price));
    
    const results = await query.limit(limit).offset(offset);
    
    // Fetch media and variants for all products in results to avoid N+1
    const productIds = results.map(p => p.id);
    
    let allMedia = [];
    let allVariants = [];
    let allCategoryIds = [];
    
    if (productIds.length > 0) {
      const { inArray } = require('drizzle-orm');
      const { product_categories } = require('../../db/schema');
      allMedia = await db.select().from(product_media)
        .where(inArray(product_media.product_id, productIds))
        .orderBy(asc(product_media.sort_order));
        
      allVariants = await db.select({
          id: product_variants.id,
          product_id: product_variants.product_id,
          sku: product_variants.sku,
          size: product_variants.size,
          color: product_variants.color,
          price_override: product_variants.price_override,
          available_quantity: inventory.available_quantity,
          reserved_quantity: inventory.reserved_quantity,
        })
        .from(product_variants)
        .leftJoin(inventory, eq(product_variants.id, inventory.variant_id))
        .where(inArray(product_variants.product_id, productIds));
        
      allCategoryIds = await db.select().from(product_categories)
        .where(inArray(product_categories.product_id, productIds));
    }
    
    const productsWithRelations = results.map(p => {
      const pMedia = allMedia.filter(m => m.product_id === p.id);
      const pVariants = allVariants.filter(v => v.product_id === p.id).map(v => ({
        ...v,
        price: v.price_override !== null ? v.price_override : p.base_price
      }));
      const pCategories = allCategoryIds.filter(c => c.product_id === p.id).map(c => c.category_id);
      return {
        ...p,
        media: pMedia,
        variants: pVariants,
        category_ids: pCategories
      };
    });

    return { products: productsWithRelations };
  });

  fastify.get('/products/search', async (request, reply) => {
    const parsed = searchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: { message: 'Validation error', details: parsed.error.format() } });
    }
    const { q, limit, offset } = parsed.data;

    const results = await db.select().from(products)
      .where(or(
        ilike(products.name, `%${q}%`),
        ilike(products.description, `%${q}%`)
      ))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(products.created_at));
      
    // Fetch media and variants for all products in results to avoid N+1
    const productIds = results.map(p => p.id);
    
    let allMedia = [];
    let allVariants = [];
    let allCategoryIds = [];
    
    if (productIds.length > 0) {
      const { inArray } = require('drizzle-orm');
      const { product_categories } = require('../../db/schema');
      allMedia = await db.select().from(product_media)
        .where(inArray(product_media.product_id, productIds))
        .orderBy(asc(product_media.sort_order));
        
      allVariants = await db.select({
          id: product_variants.id,
          product_id: product_variants.product_id,
          sku: product_variants.sku,
          size: product_variants.size,
          color: product_variants.color,
          price_override: product_variants.price_override,
          available_quantity: inventory.available_quantity,
          reserved_quantity: inventory.reserved_quantity,
        })
        .from(product_variants)
        .leftJoin(inventory, eq(product_variants.id, inventory.variant_id))
        .where(inArray(product_variants.product_id, productIds));
        
      allCategoryIds = await db.select().from(product_categories)
        .where(inArray(product_categories.product_id, productIds));
    }
    
    const productsWithRelations = results.map(p => {
      const pMedia = allMedia.filter(m => m.product_id === p.id);
      const pVariants = allVariants.filter(v => v.product_id === p.id).map(v => ({
        ...v,
        price: v.price_override !== null ? v.price_override : p.base_price
      }));
      const pCategories = allCategoryIds.filter(c => c.product_id === p.id).map(c => c.category_id);
      return {
        ...p,
        media: pMedia,
        variants: pVariants,
        category_ids: pCategories
      };
    });

    return { products: productsWithRelations };
  });

  fastify.get('/products/:id', async (request, reply) => {
    const { id } = request.params;
    
    let productResult;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(id)) {
      productResult = await db.select().from(products).where(eq(products.id, id)).limit(1);
    } else {
      productResult = await db.select().from(products).where(eq(products.slug, id)).limit(1);
    }
    
    const product = productResult[0];
    if (!product) return reply.status(404).send({ error: { message: 'Product not found' } });
    
    // Use the actual internal product.id for relationships
    const internalId = product.id;

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
      .where(eq(product_variants.product_id, internalId));

    // Append calculated price
    const variantsWithPrice = variants.map(v => ({
      ...v,
      price: v.price_override !== null ? v.price_override : product.base_price
    }));

    const media = await db.select().from(product_media).where(eq(product_media.product_id, internalId)).orderBy(asc(product_media.sort_order));

    const { product_categories } = require('../../db/schema');
    const categoriesRows = await db.select().from(product_categories).where(eq(product_categories.product_id, internalId));
    
    product.category_ids = categoriesRows.map(c => c.category_id);

    return { product, variants: variantsWithPrice, media };
  });
};
