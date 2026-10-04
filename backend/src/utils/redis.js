const Redis = require('ioredis');
const env = require('../config/env');

const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true // Prevent throwing if unavailable immediately, let /ready handle it
});

redis.on('error', (err) => {
  console.error('[Redis Client Error]', err.message);
});

module.exports = redis;
