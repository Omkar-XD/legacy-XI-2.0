const reservationWorker = require('./reservation.worker');
const paymentWorker = require('./payment.worker');
const emailWorker = require('./email.worker');

const gracefulShutdownWorkers = async () => {
  console.log('Shutting down BullMQ workers gracefully...');
  await Promise.all([
    reservationWorker.close(),
    paymentWorker.close(),
    emailWorker.close(),
  ]);
  console.log('BullMQ workers shut down.');
};

module.exports = {
  gracefulShutdownWorkers
};
