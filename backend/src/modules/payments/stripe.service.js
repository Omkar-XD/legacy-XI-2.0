const Stripe = require('stripe');
const env = require('../../config/env');

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // use latest stable
});

async function createStripeSession(amountInCents, orderId, successUrl, cancelUrl) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd', // or preferred currency
          product_data: {
            name: `Order #${orderId}`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: orderId,
  });

  return session;
}

module.exports = {
  createStripeSession,
  stripe
};
