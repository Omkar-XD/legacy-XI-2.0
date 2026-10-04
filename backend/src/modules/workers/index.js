const paymentWorker = require('./payment.worker');
const { startSweep, stopSweep } = require('./reservation.sweep');

startSweep();

const gracefulShutdownWorkers = async () => {
  console.log('Shutting down BullMQ workers gracefully...');
  await Promise.all([
    paymentWorker.close(),
  ]);
  stopSweep();
  console.log('BullMQ workers shut down.');
};

module.exports = {
  gracefulShutdownWorkers
};
