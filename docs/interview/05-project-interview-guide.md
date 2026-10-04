# Project Interview Guide

This document prepares you to answer 15 common technical interview questions using verified implementations from the Legacy XI backend.

---

### 1. Explain your project architecture.
**Answer:** "Legacy XI is a highly concurrent e-commerce backend. I built the API layer with Fastify on Node.js for high-throughput routing. For the database, I use PostgreSQL because strong ACID transactions are mandatory for inventory integrity. To handle heavy integrations like Stripe and Razorpay without blocking the main event loop, I use a Redis-backed message queue via BullMQ to process webhooks asynchronously. Finally, the frontend is a Next.js application hosted on Vercel."

### 2. What makes this project technically interesting beyond CRUD?
**Answer:** "Unlike a standard CRUD app, Legacy XI handles distributed system problems. I had to implement pessimistic row-level locking to prevent race conditions during flash sales. I also had to design an idempotent webhook ingestion pipeline using database unique constraints so that duplicate network events from Stripe don't result in double-charging or corrupting the order state machine."

### 3. What was the most difficult backend engineering problem?
**Answer:** "Preventing database deadlocks between background workers. I have a BullMQ worker that processes payments and a cron job that sweeps expired inventory reservations. Both touch the `orders`, `reservations`, and `inventory` tables. Initially, they acquired locks in different orders, which creates a classic circular dependency deadlock. I had to architect a strict Deterministic Lock Acquisition Order across the entire codebase—always locking `orders` first, then `reservations`, then `inventory`—to guarantee deadlocks are impossible."
*(Reference: `reservation.sweep.js` vs `payment.worker.js`)*

### 4. How do you prevent inventory overselling?
**Answer:** "I use Pessimistic Concurrency Control. In `checkout.routes.js`, when a user initiates checkout, my PostgreSQL transaction executes a `SELECT ... FOR UPDATE` query on the inventory rows. If a second user tries to buy the exact same item at that millisecond, the database suspends their transaction until the first one commits. This completely eliminates race conditions at the database level."

### 5. How do you handle duplicate payment webhooks?
**Answer:** "I use an idempotent ingestion pattern. In `webhooks.routes.js`, before any business logic runs, I attempt to insert the webhook's `event_id` into a `processed_webhook_events` table using a unique constraint and `ON CONFLICT DO NOTHING`. If the insert fails, I know it's a duplicate, and I immediately return a 200 OK to Stripe without touching the order state."

### 6. Why do you use Redis and BullMQ?
**Answer:** "To decouple external API latency from my fast HTTP layer. When a webhook arrives, doing all the state transitions synchronously could cause the HTTP request to timeout, making Stripe retry repeatedly. Instead, I acknowledge the webhook instantly and push the payload to BullMQ. A background worker pulls from Redis at its own pace to do the heavy database lifting."

### 7. Why do you need PostgreSQL if Redis is already present?
**Answer:** "Redis is volatile and purely in-memory. If my Redis instance crashes, I might lose jobs in the queue. PostgreSQL is my absolute durable source of truth. By storing the webhook payload in Postgres *before* pushing it to Redis, I guarantee that even if Redis suffers catastrophic data loss, I can rebuild the queue from the database."

### 8. What happens when a worker crashes?
**Answer:** "If the Node.js process crashes mid-job, the PostgreSQL transaction it was running automatically rolls back, releasing all locks. Meanwhile, BullMQ has a `stalledInterval` background checker. After a set period (I configured it to 5 minutes to save Redis polling overhead), BullMQ realizes the worker died, moves the job out of the active state, and re-queues it for another worker."

### 9. How do retries work, and what are their risks?
**Answer:** "BullMQ handles retries using exponential backoff. If a database query fails due to a transient network error, the job fails and is retried 10 seconds later, then 20, etc. The risk of retries is processing the same event twice. However, because my business logic validates state transitions (e.g., you can't transition an order from `PAID` to `PAID`), it is mathematically safe to retry a job indefinitely."

### 10. How do you maintain consistency across payments, orders, and inventory?
**Answer:** "Everything runs inside monolithic PostgreSQL transactions (`db.transaction`). If a worker successfully marks an order as paid, but fails to release the inventory lock because of a syntax error or a crash, the entire block rolls back. The database is never left in an intermediate state where an order is paid but the inventory is permanently reserved."

### 11. What happens when Redis becomes unavailable?
**Answer:** "If Upstash goes down, my webhook routes will successfully insert the event into PostgreSQL, but throw an error when calling `paymentQueue.add()`. Stripe will see a 500 error and retry later. Once Redis comes back online, Stripe's retry will hit my idempotent route, skip the Postgres insert, successfully push to the queue, and recover seamlessly."

### 12. What concurrency problems did you consider?
**Answer:** "Beyond checkout race conditions, I had to consider concurrent background workers. My reservation sweeper runs on a cron job. If I scale my backend to 3 instances, 3 sweepers might run at the same time and fight over the same expired reservations. I solved this using `FOR UPDATE SKIP LOCKED`. If instance A is processing reservation #1, instance B's query simply skips it and processes reservation #2, creating a lock-free distributed task queue."

### 13. Why did you choose this architecture over a simpler alternative?
**Answer:** "A simpler CRUD architecture without queues or pessimistic locking works perfectly fine until you hit scale or integrate with third-party webhooks. The moment you run a flash sale, or Stripe's network blips and sends duplicates, a basic CRUD app will oversell inventory and double-count revenue. The complexity of BullMQ and Row-Level Locking pays for itself by preventing catastrophic business failures."

### 14. What are the current architectural limitations?
**Answer:** "Pessimistic locking is great for data integrity but bad for extreme throughput on a single item. If 10,000 people try to buy the exact same jersey, they queue up in Postgres, which could exhaust the database connection pool."

### 15. What would you improve next, and why?
**Answer:** "To solve the connection pool limitation, I would move to an asynchronous checkout model. Instead of hitting Postgres synchronously on checkout, the route would push the intent to a Kafka or Redis queue. A single fast consumer would process checkouts sequentially, completely removing database lock contention, and users would get a 'Processing...' UI until a WebSocket confirms their purchase."
