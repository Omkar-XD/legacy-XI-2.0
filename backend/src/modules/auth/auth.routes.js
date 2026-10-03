const { db } = require('../../db/index');
const { users } = require('../../db/schema');
const { eq } = require('drizzle-orm');
const { hashPassword, comparePassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');
const { registerSchema, loginSchema } = require('./auth.schema');
const { requireAuth, requireAdmin } = require('../../middleware/auth');
const env = require('../../config/env');

const setCookie = (reply, token) => {
  reply.setCookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
};

module.exports = async function (fastify, opts) {
  
  fastify.post('/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { message: 'Validation error', details: parsed.error.format() } });
    }
    const { email, password } = parsed.data;

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return reply.status(400).send({ error: { message: 'Email already exists' } });
    }

    const password_hash = await hashPassword(password);
    
    // First user could be admin? We will just make them customer. Admin creation can be manual or seeder.
    // We will allow passing a secret role for testing admin, or just default to customer.
    // For testing admin auth, let's allow 'role' in body ONLY for testing if it's 'admin'. Or we can just manually insert an admin.
    // The requirement says "Do not trust a frontend role." so we won't allow passing role.
    
    const [newUser] = await db.insert(users).values({
      email,
      password_hash,
      role: 'customer'
    }).returning({ id: users.id, email: users.email, role: users.role });

    return reply.status(201).send({ user: newUser });
  });

  fastify.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { message: 'Validation error', details: parsed.error.format() } });
    }
    const { email, password } = parsed.data;

    const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userResult[0];

    if (!user) {
      return reply.status(401).send({ error: { message: 'Invalid credentials' } });
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return reply.status(401).send({ error: { message: 'Invalid credentials' } });
    }

    const token = signToken({ id: user.id });
    setCookie(reply, token);

    return reply.send({ user: { id: user.id, email: user.email, role: user.role } });
  });

  fastify.post('/logout', async (request, reply) => {
    reply.clearCookie('token', {
      path: '/',
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return reply.send({ message: 'Logged out successfully' });
  });

  fastify.get('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    return reply.send({ user: request.user });
  });

  // Admin test endpoint
  fastify.get('/admin-only', { preHandler: [requireAdmin] }, async (request, reply) => {
    return reply.send({ message: 'Welcome admin' });
  });
};
