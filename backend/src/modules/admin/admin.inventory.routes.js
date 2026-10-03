const { db } = require('../../db');
const { inventory, reservations, product_variants } = require('../../db/schema');
const { eq } = require('drizzle-orm');
const { requireAdmin } = require('../../middleware/auth');
const { z } = require('zod');

const adjustStockSchema = z.object({
  available_quantity: z.number().int().nonnegative(),
});

module.exports = async function (fastify, opts) {
  fastify.addHook('preHandler', requireAdmin);

  fastify.get('/inventory', async (request, reply) => {
    const results = await db.select().from(inventory);
    return { inventory: results };
  });

  fastify.patch('/inventory/:variant_id', async (request, reply) => {
    const { variant_id } = request.params;
    const parsed = adjustStockSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { message: 'Validation error', details: parsed.error.format() } });
    }

    const [updated] = await db.update(inventory)
      .set({
        available_quantity: parsed.data.available_quantity,
        updated_at: new Date()
      })
      .where(eq(inventory.variant_id, variant_id))
      .returning();

    if (!updated) return reply.status(404).send({ error: { message: 'Inventory record not found' } });
    return { inventory: updated };
  });

  fastify.get('/reservations', async (request, reply) => {
    const results = await db.select().from(reservations);
    return { reservations: results };
  });
};
