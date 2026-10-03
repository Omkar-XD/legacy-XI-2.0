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

const reservationQueue = new Queue('reservation-expiration', { connection, defaultJobOptions });
const paymentQueue = new Queue('payment-webhooks', { connection, defaultJobOptions });
const emailQueue = new Queue('email-notifications', { connection, defaultJobOptions });

module.exports = {
  connection,
  reservationQueue,
  paymentQueue,
  emailQueue
};
