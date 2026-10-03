const { db } = require('../../db');
const { orders } = require('../../db/schema');
const { eq } = require('drizzle-orm');

const VALID_TRANSITIONS = {
  PENDING: ['PAYMENT_PENDING', 'PROCESSING', 'CANCELED'],
  PAYMENT_PENDING: ['PAID', 'PROCESSING', 'FAILED', 'CANCELED'],
  PAID: ['PROCESSING', 'CANCELED'],
  PROCESSING: ['SHIPPED', 'CANCELED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  CANCELED: [],
  FAILED: []
};

async function transitionOrderStatus(orderId, newStatus, transaction = db) {
  // If we are passing an existing transaction, we use it, otherwise we run a new one
  const exec = transaction === db ? db.transaction.bind(db) : (cb) => cb(transaction);

  return await exec(async (tx) => {
    // Lock the order row to prevent race conditions during transition
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .for('update');

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const currentStatus = order.status;
    const allowedNextStatuses = VALID_TRANSITIONS[currentStatus] || [];

    if (!allowedNextStatuses.includes(newStatus)) {
      throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
    }

    const [updatedOrder] = await tx
      .update(orders)
      .set({
        status: newStatus,
        updated_at: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning();

    return updatedOrder;
  });
}

module.exports = {
  VALID_TRANSITIONS,
  transitionOrderStatus
};
