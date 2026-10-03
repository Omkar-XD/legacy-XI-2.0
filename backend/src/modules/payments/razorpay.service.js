const Razorpay = require('razorpay');
const crypto = require('crypto');
const env = require('../../config/env');

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

async function createRazorpayOrder(amountInCents, receiptId) {
  const options = {
    amount: amountInCents,
    currency: 'INR',
    receipt: receiptId,
  };
  
  return await razorpay.orders.create(options);
}

function verifyRazorpaySignature(orderId, paymentId, signature) {
  const text = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex');
    
  return expectedSignature === signature;
}

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature
};
