const { verifyToken } = require('../utils/jwt');
const { queryClient } = require('../db');
const { users } = require('../db/schema');
const { eq } = require('drizzle-orm');

// Note: Using Drizzle's eq inside auth middleware, so we import the db instance to query
const { db } = require('../db/index');

const requireAuth = async (request, reply) => {
  const token = request.cookies.token;
  if (!token) {
    return reply.status(401).send({ error: { message: 'Authentication required' } });
  }

  try {
    const decoded = verifyToken(token);
    const userResult = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
    const user = userResult[0];

    if (!user) {
      return reply.status(401).send({ error: { message: 'Invalid token' } });
    }

    request.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    return reply.status(401).send({ error: { message: 'Invalid token' } });
  }
};

const requireAdmin = async (request, reply) => {
  await requireAuth(request, reply);
  // fastify automatically stops execution if requireAuth sends a response
  if (reply.sent) return;

  if (request.user.role !== 'admin') {
    return reply.status(403).send({ error: { message: 'Admin authorization required' } });
  }
};

module.exports = {
  requireAuth,
  requireAdmin,
};
