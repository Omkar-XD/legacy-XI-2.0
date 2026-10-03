const { db } = require('../../db');
const { users, addresses } = require('../../db/schema');
const { eq, and } = require('drizzle-orm');
const { requireAuth } = require('../../middleware/auth');

module.exports = async function (fastify, opts) {
  fastify.addHook('preHandler', requireAuth);

  // Profile API
  fastify.get('/profile', async (request, reply) => {
    const userId = request.user.id;
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      role: users.role,
      first_name: users.first_name,
      last_name: users.last_name,
      phone: users.phone,
      dob: users.dob,
      avatar_url: users.avatar_url,
      created_at: users.created_at
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (!user) return reply.status(404).send({ error: { message: 'Profile not found' }});
    return { profile: user };
  });

  fastify.patch('/profile', async (request, reply) => {
    const userId = request.user.id;
    const { first_name, last_name, phone, dob, avatar_url } = request.body;

    const updates = { updated_at: new Date() };
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (phone !== undefined) updates.phone = phone;
    if (dob !== undefined) updates.dob = dob ? new Date(dob) : null;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    const [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning({
      id: users.id,
      email: users.email,
      role: users.role,
      first_name: users.first_name,
      last_name: users.last_name,
      phone: users.phone,
      dob: users.dob,
      avatar_url: users.avatar_url,
      updated_at: users.updated_at
    });

    return { profile: updated };
  });

  fastify.post('/profile/avatar', async (request, reply) => {
    const userId = request.user.id;
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: { message: 'No file uploaded' }});
    }

    try {
      const { uploadMedia } = require('../../utils/cloudinary');
      const buffer = await data.toBuffer();
      const result = await uploadMedia(buffer, 'image');

      const [updated] = await db.update(users).set({ avatar_url: result.secure_url, updated_at: new Date() }).where(eq(users.id, userId)).returning({
        avatar_url: users.avatar_url
      });

      return reply.status(200).send({ avatar_url: updated.avatar_url });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: { message: 'Failed to upload avatar' }});
    }
  });

  // Addresses API
  fastify.get('/addresses', async (request, reply) => {
    const userId = request.user.id;
    const userAddresses = await db.select().from(addresses).where(eq(addresses.user_id, userId));
    return { addresses: userAddresses };
  });

  fastify.post('/addresses', async (request, reply) => {
    const userId = request.user.id;
    const { 
      type, first_name, last_name, phone, 
      address_line_1, address_line_2, city, state, postal_code, country, is_default 
    } = request.body;

    if (!address_line_1 || !city || !state || !postal_code || !country) {
      return reply.status(400).send({ error: { message: 'Required address fields missing' }});
    }

    if (is_default === 1) {
      // Unset previous defaults
      await db.update(addresses).set({ is_default: 0 }).where(and(eq(addresses.user_id, userId), eq(addresses.type, type || 'shipping')));
    }

    const [newAddress] = await db.insert(addresses).values({
      user_id: userId,
      type: type || 'shipping',
      first_name, last_name, phone,
      address_line_1, address_line_2, city, state, postal_code, country,
      is_default: is_default || 0
    }).returning();

    return reply.status(201).send({ address: newAddress });
  });

  fastify.patch('/addresses/:id', async (request, reply) => {
    const userId = request.user.id;
    const { id } = request.params;
    
    const [existing] = await db.select().from(addresses).where(and(eq(addresses.id, id), eq(addresses.user_id, userId))).limit(1);
    if (!existing) return reply.status(404).send({ error: { message: 'Address not found' }});

    const updates = { ...request.body, updated_at: new Date() };

    if (updates.is_default === 1) {
      await db.update(addresses).set({ is_default: 0 }).where(and(eq(addresses.user_id, userId), eq(addresses.type, existing.type)));
    }

    const [updatedAddress] = await db.update(addresses).set(updates).where(eq(addresses.id, id)).returning();
    return { address: updatedAddress };
  });

  fastify.delete('/addresses/:id', async (request, reply) => {
    const userId = request.user.id;
    const { id } = request.params;

    const [deleted] = await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.user_id, userId))).returning();
    if (!deleted) return reply.status(404).send({ error: { message: 'Address not found' }});

    return { message: 'Address deleted' };
  });
};
