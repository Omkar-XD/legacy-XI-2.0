const buildApp = require('./app');
const env = require('./config/env');
const { queryClient } = require('./db/index');
const redis = require('./utils/redis');

const { initAdmin } = require('./utils/initAdmin');

const app = buildApp();

const start = async () => {
  try {
    await initAdmin();
    await app.listen({ port: parseInt(env.PORT), host: '0.0.0.0' });
    app.log.info(`Server listening on port ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

const { gracefulShutdownWorkers } = require('./modules/workers');

const gracefulShutdown = async (signal) => {
  app.log.info(`Received ${signal}. Shutting down gracefully...`);
  try {
    await app.close();
    await gracefulShutdownWorkers();
    await queryClient.end();
    await redis.quit();
    app.log.info('Closed out remaining connections.');
    process.exit(0);
  } catch (err) {
    app.log.error('Error during shutdown', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

start();
// trigger nodemon restart
