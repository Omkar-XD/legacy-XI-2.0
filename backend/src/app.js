const Fastify = require('fastify');
const cors = require('@fastify/cors');
const cookie = require('@fastify/cookie');
const crypto = require('crypto');
const env = require('./config/env');
const { queryClient } = require('./db/index');
const redis = require('./utils/redis');

function buildApp(opts = {}) {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'info' : 'warn',
    },
    genReqId: function (req) {
      return req.headers['x-request-id'] || crypto.randomUUID();
    },
    ...opts
  });

  app.register(cors, {
    origin: [env.FRONTEND_URL, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB max
    }
  });

  app.register(cookie, {
    secret: env.COOKIE_SECRET,
    parseOptions: {}
  });

  app.setErrorHandler(function (error, request, reply) {
    app.log.error(error);
    reply.status(error.statusCode || 500).send({
      error: {
        message: error.message || 'Internal Server Error',
        code: error.code || 'INTERNAL_ERROR',
      }
    });
  });

  app.get('/health', async (request, reply) => {
    return { status: 'ok' };
  });

  app.get('/ready', async (request, reply) => {
    try {
      // Check Postgres
      await queryClient`SELECT 1`;

      return { status: 'ready' };
    } catch (err) {
      app.log.error(err, 'Readiness check failed');
      return reply.status(503).send({ status: 'unavailable', details: err.message });
    }
  });

  app.register(require('./modules/auth/auth.routes'), { prefix: '/api/auth' });
  app.register(require('./modules/catalog/catalog.routes'), { prefix: '/api' });
  app.register(require('./modules/admin/admin.routes'), { prefix: '/api/admin' });
  app.register(require('./modules/admin/admin.inventory.routes'), { prefix: '/api/admin' });
  app.register(require('./modules/admin/admin.orders.routes'), { prefix: '/api/admin' });
  app.register(require('./modules/admin/admin.media.routes'), { prefix: '/api/admin' });
  app.register(require('./modules/cart/cart.routes'), { prefix: '/api/cart' });
  app.register(require('./modules/checkout/checkout.routes'), { prefix: '/api/checkout' });
  app.register(require('./modules/orders/orders.routes'), { prefix: '/api/orders' });
  app.register(require('./modules/payments/payments.routes'), { prefix: '/api/payments' });
  app.register(require('./modules/payments/webhooks.routes'), { prefix: '/api/payments' });
  app.register(require('./modules/account/account.routes'), { prefix: '/api/account' });

  return app;
}

module.exports = buildApp;
