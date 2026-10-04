const reservationWorker = require('./reservation.worker');
const paymentWorker = require('./payment.worker');
const emailWorker = require('./email.worker');
const { startSweep, stopSweep } = require('./reservation.sweep');

startSweep();

const gracefulShutdownWorkers = async () => {
  console.log('Shutting down BullMQ workers gracefully...');
  await Promise.all([
    reservationWorker.close(),
    paymentWorker.close(),
    emailWorker.close(),
  ]);
  stopSweep();
  console.log('BullMQ workers shut down.');
};

module.exports = {
  gracefulShutdownWorkers
};
