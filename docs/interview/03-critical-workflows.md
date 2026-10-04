# Critical Workflows in Legacy XI

This document traces the exact execution paths of the most critical and complex workflows in the Legacy XI backend, focusing on database boundaries, locking, and failure handling.

---

## 1. Checkout and Inventory Reservation

**Trigger:** User clicks "Checkout" in the cart.
**File:** `src/modules/checkout/checkout.routes.js`

1. **Transaction Begins:** A monolithic Postgres transaction (`db.transaction`) opens.
2. **Fetch and Sort:** Cart items are fetched. Crucially, items are sorted by `variant_id` to ensure deterministic lock acquisition (preventing deadlocks when two users checkout carts containing the same items in different orders).
3. **Lock Acquisition:** For each item, the route executes `SELECT ... FOR UPDATE` against the `inventory` table.
4. **Validation:** Checks if `available_quantity < item.quantity`. If true, the transaction rolls back safely.
5. **Mutation:** 
   - Deducts `available_quantity`.
   - Increments `reserved_quantity`.
   - Creates an `order` with status `PAYMENT_PENDING`.
   - Creates `reservations` rows with status `RESERVED` and an `expires_at` timestamp set to 15 minutes in the future.
6. **Transaction Commits:** Locks are released. The cart is cleared.

---

## 2. Stripe/Razorpay Webhook Ingestion & Duplicates

**Trigger:** Stripe sends a `checkout.session.completed` POST request.
**File:** `src/modules/payments/webhooks.routes.js`

1. **Cryptographic Validation:** The raw buffer of the payload is hashed and compared against the provider signature header (`stripe-signature` / `x-razorpay-signature`). If invalid, drops the request (400).
2. **Idempotent Ingestion (Failure Window Protection):** 
   - Executes: `INSERT INTO processed_webhook_events (event_id, provider) VALUES (...) ON CONFLICT DO NOTHING RETURNING *`
   - If `record` is null (meaning the event already exists), it is a **duplicate webhook**. The route fetches the existing status, and returns `200 OK` to Stripe without executing any further logic.
3. **Queue Handoff:** The event payload is pushed to BullMQ: `paymentQueue.add(...)`.
4. **Fast Acknowledgment:** Returns `200 OK`. The entire process takes less than 50ms, ensuring Stripe never times out and resends the event.

---

## 3. Background Job Processing (Payment Worker)

**Trigger:** BullMQ worker picks up the job from Redis.
**File:** `src/modules/workers/payment.worker.js`

1. **Transaction Begins:** The worker opens a Postgres transaction.
2. **Locking Hierarchy:** 
   - Locks the `payments` record (`FOR UPDATE`).
   - Locks the `orders` record (`FOR UPDATE`).
3. **State Machine Transition:** Updates the order status to `PAID`. (If the order was already `CANCELED` by the sweeper, the state machine rejects the transition and throws an error).
4. **Reservation Confirmation:** Updates all related `reservations` to `CONFIRMED_SOLD`.
5. **Idempotency Mark:** Updates the `processed_webhook_events` table status to `processed`.
6. **Transaction Commits:** All locks are released.

**Failure Handling (Worker Crash):** If the Node.js process OOM kills or restarts midway, the Postgres transaction rolls back. BullMQ detects the stalled job (after 5 minutes, based on our `stalledInterval` setting) and re-queues it for another worker to process.

---

## 4. Reservation Expiration and Release

**Trigger:** Node.js `setInterval` fires every 60 seconds.
**File:** `src/modules/workers/reservation.sweep.js`

1. **Detection:** Queries `reservations` where `status = 'RESERVED'` and `expires_at < NOW()`.
2. **Transaction Begins:** For each expired reservation, opens a transaction.
3. **Locking Hierarchy:**
   - Locks the parent `orders` row (`FOR UPDATE`).
   - Locks the `reservations` row (`FOR UPDATE SKIP LOCKED`). If another sweeper instance locked it, it skips it.
4. **Race Condition Check:** 
   - Checks if the order is already `PAID` (Payment won the race). If true, it quietly updates the reservation to `CONFIRMED_SOLD` and exits.
5. **Inventory Release:**
   - Locks `inventory` (`FOR UPDATE`).
   - Increments `available_quantity`.
   - Decrements `reserved_quantity`.
   - Marks reservation as `RELEASED`.
6. **Order Cancellation:** Transitions the order to `CANCELED`.
7. **Transaction Commits:** Locks are released.

---

## 5. The Payment-Versus-Expiration Race Condition

**Scenario:** A user waits exactly 14 minutes and 59 seconds before completing their Stripe payment. Stripe sends the success webhook at the exact same millisecond the Reservation Sweeper detects the 15-minute expiration.

**How Legacy XI Handles It:**
Both the Payment Worker and the Sweeper attempt to process the exact same order concurrently.
1. The **Deterministic Lock Ordering** dictates that whoever reaches the `orders` row lock first wins.
2. **If Payment Worker wins:** It locks the order, marks it `PAID`, and commits. A millisecond later, the Sweeper acquires the lock, reads the order, sees it is `PAID`, says "Oops, payment beat me", and peacefully marks the reservation as `CONFIRMED_SOLD` instead of releasing inventory.
3. **If Sweeper wins:** It locks the order, cancels it, releases the inventory, and commits. A millisecond later, the Payment Worker acquires the lock, attempts to transition the order to `PAID`, but the state machine (`orders.service.js`) throws an `Invalid transition from CANCELED to PAID` error. The payment job fails, and an administrator must manually refund the user or reallocate inventory. 

*(Note: This is mathematically safe. It is always better to accidentally cancel an order and require a manual refund than to successfully accept money for an item that was already released to another customer).*
