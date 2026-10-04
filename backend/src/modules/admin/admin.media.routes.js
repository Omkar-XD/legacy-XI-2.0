const { db } = require('../../db');
const { products, product_media } = require('../../db/schema');
const { eq, and } = require('drizzle-orm');
const { requireAdmin } = require('../../middleware/auth');
const { uploadMedia, deleteMedia } = require('../../utils/cloudinary');

module.exports = async function (fastify, opts) {
  fastify.addHook('preHandler', requireAdmin);

  fastify.post('/products/:id/media', async (request, reply) => {
    const { id } = request.params;
    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    
    if (!product) {
      return reply.status(404).send({ error: { message: 'Product not found' }});
    }

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: { message: 'No file uploaded' }});
    }

    try {
      const buffer = await data.toBuffer();
      const resourceType = data.mimetype.startsWith('video/') ? 'video' : 'image';
      
      const result = await uploadMedia(buffer, resourceType);

      const [mediaRow] = await db.insert(product_media).values({
        product_id: id,
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: resourceType,
        sort_order: 0,
      }).returning();

      return reply.status(201).send({ media: mediaRow });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: { message: 'Failed to upload media to Cloudinary' }});
    }
  });

  fastify.post('/products/:id/media-url', async (request, reply) => {
    const { id } = request.params;
    const { url, resource_type, sort_order } = request.body;
    
    if (!url) {
      return reply.status(400).send({ error: { message: 'URL is required' }});
    }

    const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!product) {
      return reply.status(404).send({ error: { message: 'Product not found' }});
    }

    try {
      const [mediaRow] = await db.insert(product_media).values({
        product_id: id,
        url: url,
        public_id: url, // For external URLs, we use the URL as public_id
        resource_type: resource_type || 'image',
        sort_order: sort_order || 0,
      }).returning();

      return reply.status(201).send({ media: mediaRow });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: { message: 'Failed to add media URL' }});
    }
  });

  fastify.patch('/media/:id', async (request, reply) => {
    const { id } = request.params;
    const { alt_text, sort_order, poster_url } = request.body;

    const updates = { updated_at: new Date() };
    if (alt_text !== undefined) updates.alt_text = alt_text;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    if (poster_url !== undefined) updates.poster_url = poster_url;

    if (Object.keys(updates).length === 1) return reply.status(400).send({ error: { message: 'No updates provided' }});

    const [updatedMedia] = await db.update(product_media).set(updates).where(eq(product_media.id, id)).returning();
    if (!updatedMedia) return reply.status(404).send({ error: { message: 'Media not found' }});

    return { media: updatedMedia };
  });

  fastify.delete('/media/:id', async (request, reply) => {
    const { id } = request.params;

    const [media] = await db.select().from(product_media).where(eq(product_media.id, id)).limit(1);
    if (!media) return reply.status(404).send({ error: { message: 'Media not found' }});

    try {
      await deleteMedia(media.public_id, media.resource_type);
      await db.delete(product_media).where(eq(product_media.id, id));
      
      return { message: 'Media deleted successfully' };
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: { message: 'Failed to delete media from Cloudinary' }});
    }
  });
};
