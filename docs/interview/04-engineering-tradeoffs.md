# Engineering Trade-offs in Legacy XI

A core part of senior engineering is recognizing that no architecture is perfect—every design decision introduces trade-offs. This document explores the specific trade-offs accepted in Legacy XI and why they make sense for this project's scale.

---

## 1. Pessimistic Locking vs. Optimistic Concurrency

**The Decision:** Legacy XI uses Pessimistic Locking (`SELECT ... FOR UPDATE`) during checkout to serialize access to inventory rows.

**The Trade-off:**
- *Pros:* 100% guarantee against overselling. Extremely simple developer mental model (no need to write complex retry loops in application code).
- *Cons:* Reduces maximum throughput for a single heavily contested item. If 1,000 users try to buy the same jersey at the exact same millisecond, they form a queue in the database, potentially causing connection pool exhaustion or query timeouts.

**When to switch:** If Legacy XI grew to the size of Ticketmaster or Nike SNKRS, pessimistic locking on a single row would melt the database. We would need to switch to an asynchronous queuing model where checkouts are pushed to Kafka, processed sequentially by a single consumer, and users are notified later via WebSockets if they secured the item.

## 2. BullMQ (Redis) vs. Database-Backed Queues

**The Decision:** Webhook processing relies on BullMQ backed by Upstash Redis, instead of using a PostgreSQL-backed queue (like Graphile Worker).

**The Trade-off:**
- *Pros:* Redis handles list pushing and popping (using `BZMPOP`) at in-memory speeds, completely offloading queue polling from PostgreSQL. It provides excellent built-in dashboards, exponential backoff, and concurrency controls out of the box.
- *Cons:* Adds an entirely new infrastructure piece (Upstash Redis) that must be monitored. Because Redis is volatile, if it crashes, active jobs in memory could be lost.

**Mitigation:** Legacy XI mitigates the volatility risk by durably storing every incoming webhook in the PostgreSQL `processed_webhook_events` table *before* pushing to Redis. If Redis dies, an admin can write a script to re-enqueue pending webhooks directly from Postgres.

## 3. Database Sweeping (`SKIP LOCKED`) vs. BullMQ Delayed Jobs

**The Decision:** Inventory reservation expiration is handled natively in PostgreSQL using a cron-like sweeper (`reservation.sweep.js`) instead of pushing a delayed job to BullMQ.

**The Trade-off:**
- *Pros:* Drastically reduces Redis command overhead. BullMQ delayed jobs require constant `ZREVRANGEBYSCORE` polling against Redis, which exhausted our Upstash free tier. The database sweeper eliminates that cost. By using `SKIP LOCKED`, it remains concurrency-safe if we scale to multiple API servers.
- *Cons:* Database polling is slightly less real-time. If the `setInterval` runs every 60 seconds, a reservation might expire at 15m 00s, but not be released until 15m 59s. 

**When to switch:** If the system needed microsecond-precision expiration, or if querying `WHERE status = 'RESERVED' AND expires_at < NOW()` required full table scans on millions of rows, polling the database would degrade performance. However, with proper indexing and e-commerce scale (thousands of active reservations, not millions), this is perfectly optimal.

## 4. Stalled Interval Relaxation (5 Minutes vs 30 Seconds)

**The Decision:** The Payment Worker's `stalledInterval` was intentionally increased from BullMQ's default of 30 seconds to 5 minutes (`300,000` ms).

**The Trade-off:**
- *Pros:* Reduces background Redis polling commands by 90%, staying comfortably within free-tier infrastructure limits without sacrificing features.
- *Cons:* If the Render container forcefully crashes in the middle of processing a payment webhook, BullMQ won't detect the "stalled" job and re-assign it to a new worker for up to 5 minutes.
- *Why it's acceptable:* Webhooks are inherently asynchronous. Stripe handles payment status independently. A 5-minute delay in updating our internal order status during a rare infrastructure crash does not impact the actual movement of money or the user's initial payment success page.

## 5. Webhook Idempotency inside the Database

**The Decision:** Legacy XI deduplicates webhooks using PostgreSQL's `ON CONFLICT DO NOTHING` instead of checking a cache in Redis.

**The Trade-off:**
- *Pros:* Absolute guarantee of idempotency. Redis caches can be evicted, expiring keys might let a late duplicate slip through. Postgres unique constraints are permanent and ACID-compliant.
- *Cons:* Adds write load to the primary database for every single webhook, including duplicates. 

**Why it's acceptable:** For an e-commerce platform, data integrity (not double-shipping a product) is vastly more important than the microscopic performance gain of deduplicating in memory.
