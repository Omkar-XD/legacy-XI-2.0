# Legacy XI Study Roadmap

To master the backend engineering concepts in this project, study them in this specific order. Do not skip to advanced distributed systems concepts before understanding the database layer, as everything in Legacy XI relies on PostgreSQL for consistency.

---

## 1. Project Architecture and Request Lifecycle
- **Files to read:** `src/app.js`, `src/server.js`
- **Prerequisites:** Basic understanding of Node.js and HTTP.
- **Core Concept:** How Fastify bootstraps, registers routes, and connects to Postgres/Redis.
- **Exercise:** Trace a simple GET request (like fetching products) from the route handler to the database query and back.
- **Interview Goal:** Be able to draw the high-level architecture diagram on a whiteboard.

## 2. Database Schema and SQL
- **Files to read:** `src/db/schema.js`
- **Prerequisites:** Relational database concepts (Primary Keys, Foreign Keys).
- **Core Concept:** How the Drizzle ORM maps JavaScript to PostgreSQL tables, specifically the relationships between `orders`, `order_items`, `reservations`, and `inventory`.
- **Exercise:** Write raw SQL queries that mimic what Drizzle is doing when fetching an order and its items.
- **Interview Goal:** Be able to explain the difference between `inventory` (absolute stock) and `reservations` (temporary holds).

## 3. Transactions and Concurrency (The most important module)
- **Files to read:** `src/modules/checkout/checkout.routes.js`
- **Prerequisites:** ACID properties, basic SQL.
- **Core Concept:** Pessimistic locking. Understand exactly what `tx.select()...for('update')` does at the database level.
- **Exercise:** Open two instances of `psql` (the Postgres CLI). Run a `BEGIN` transaction in both. Run `SELECT * FROM inventory FOR UPDATE` in the first, then try the same in the second. Watch the second one hang. Then `COMMIT` the first and watch the second resume.
- **Interview Goal:** Answer: "How do you prevent two users from buying the last item in stock?"

## 4. Inventory Reservation and Expiration
- **Files to read:** `src/modules/workers/reservation.sweep.js`
- **Prerequisites:** Transactions, Cron jobs.
- **Core Concept:** Database polling with `FOR UPDATE SKIP LOCKED`. Understand how the sweeper safely handles expired reservations without deadlocking against payment workers.
- **Exercise:** Manually change an active reservation's `expires_at` timestamp in the database to the past, and watch the sweeper pick it up and release the inventory in the console logs.
- **Interview Goal:** Answer: "How do you handle scaling a background sweeper across multiple servers without lock contention?"

## 5. Payment Lifecycle and Webhook Idempotency
- **Files to read:** `src/modules/payments/webhooks.routes.js`
- **Prerequisites:** HTTP Webhooks, Database Unique Constraints.
- **Core Concept:** At-least-once delivery and `ON CONFLICT DO NOTHING`.
- **Exercise:** Use Postman or curl to send the exact same webhook JSON payload twice to your local API. Verify that the first returns a 200 and inserts into the database, and the second returns a 200 but drops the duplicate event safely.
- **Interview Goal:** Answer: "How do you prevent duplicate charges if Stripe sends the success event twice?"

## 6. Redis and BullMQ
- **Files to read:** `src/modules/workers/queues.js`, `src/modules/workers/payment.worker.js`
- **Prerequisites:** In-memory datastores, Publisher/Subscriber patterns.
- **Core Concept:** The Outbox Pattern variant. Why we push heavy workloads off the HTTP thread and into a Redis-backed queue.
- **Exercise:** Add a `console.log` inside the payment worker, trigger a webhook, and watch the worker process it asynchronously.
- **Interview Goal:** Answer: "Why use Redis and a queue instead of processing the payment synchronously in the HTTP route?"

## 7. Retry Strategies and Recovery
- **Files to read:** BullMQ documentation on `stalledInterval` and exponential backoff.
- **Prerequisites:** BullMQ architecture.
- **Core Concept:** Failing fast and safely recovering from process crashes.
- **Exercise:** Hard-kill (Ctrl+C) your Node server exactly while the payment worker is in the middle of processing a job. Wait 5 minutes, restart the server, and watch BullMQ recover the "stalled" job and process it successfully.
- **Interview Goal:** Answer: "What happens to a payment if your Node.js server crashes mid-request?"

## 8. Architecture Trade-offs and Failure Analysis
- **Files to read:** `04-engineering-tradeoffs.md`
- **Prerequisites:** Completion of all previous modules.
- **Core Concept:** Understanding that pessimistic locking bottlenecks throughput, and Redis adds infrastructure volatility.
- **Exercise:** Diagram what happens to your system if (A) PostgreSQL goes down, (B) Redis goes down, or (C) Stripe goes down. Identify which failures cause data loss versus which cause temporary downtime.
- **Interview Goal:** Answer: "What are the limitations of your current architecture, and how would you redesign it if your traffic increased 100x?"
