const { Worker } = require('bullmq');
const { connection } = require('./queues');

const emailWorker = new Worker('email-notifications', async (job) => {
  const { to, subject, body } = job.data;
  console.log(`[EmailWorker] Sending email to ${to}: ${subject}`);
  // Implement actual SMTP sending here
}, { connection });

emailWorker.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job ${job.id} failed:`, err);
});

module.exports = emailWorker;
