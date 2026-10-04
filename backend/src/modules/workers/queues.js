const { Queue } = require('bullmq');
const env = require('../../config/env');

const connection = {
  url: env.REDIS_URL,
};

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};

const paymentQueue = new Queue('payment-webhooks', { connection, defaultJobOptions });

paymentQueue.on('error', (err) => {
  console.error('[PaymentQueue] Error:', err.message);
});

module.exports = {
  connection,
  paymentQueue
};
