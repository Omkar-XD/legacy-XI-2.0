const Redis = require('ioredis');
const env = require('./src/config/env');

const redis = new Redis(env.REDIS_URL);

async function run() {
  try {
    const info = await redis.info('memory');
    console.log('--- Redis Memory Info ---');
    console.log(info.split('\n').filter(line => line.startsWith('used_memory')).join('\n'));

    let cursor = '0';
    const counts = {
      bullmq: 0,
      cache: 0,
      other: 0,
      bullmq_failed: 0,
      bullmq_completed: 0,
      bullmq_active: 0,
      bullmq_wait: 0,
      bullmq_delayed: 0
    };

    do {
      const result = await redis.scan(cursor, 'MATCH', '*', 'COUNT', 1000);
      cursor = result[0];
      const keys = result[1];

      for (const key of keys) {
        if (key.includes('bull:')) {
          counts.bullmq++;
          if (key.includes('Failed') || key.includes('failed')) counts.bullmq_failed++;
          else if (key.includes('Completed') || key.includes('completed')) counts.bullmq_completed++;
          else if (key.includes('Active') || key.includes('active')) counts.bullmq_active++;
          else if (key.includes('Wait') || key.includes('wait')) counts.bullmq_wait++;
          else if (key.includes('Delayed') || key.includes('delayed')) counts.bullmq_delayed++;
        } else if (key.includes('cache')) {
          counts.cache++;
        } else {
          counts.other++;
        }
      }
    } while (cursor !== '0');

    console.log('\n--- Redis Keys Breakdown ---');
    console.log(JSON.stringify(counts, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    redis.disconnect();
  }
}

run();
