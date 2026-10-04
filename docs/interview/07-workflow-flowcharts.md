# Legacy XI Comprehensive Flowcharts

Here are the system architectures visualized as state/process flowcharts using Mermaid, matching the style you provided.

These diagrams use conditional diamonds, colored state blocks (red for errors, green for success, yellow for database), and subgraphs to group related processing phases.

---

## 1. The Complete Checkout & Webhook Lifecycle

This flowchart maps the entire journey of a user clicking "Checkout", the synchronous database locks, the hand-off to Stripe, the asynchronous webhook ingestion, and the final BullMQ worker processing.

```mermaid
flowchart TD
    %% Styling Classes
    classDef user fill:#bae6fd,stroke:#0369a1,stroke-width:2px,color:#000;
    classDef db fill:#fef08a,stroke:#a16207,stroke-width:2px,color:#000;
    classDef error fill:#fecaca,stroke:#b91c1c,stroke-width:2px,color:#000;
    classDef external fill:#e5e7eb,stroke:#374151,stroke-width:2px,color:#000;
    classDef decision fill:#fed7aa,stroke:#c2410c,stroke-width:2px,color:#000;
    classDef success fill:#a7f3d0,stroke:#047857,stroke-width:2px,color:#000;
    classDef worker fill:#e9d5ff,stroke:#7e22ce,stroke-width:2px,color:#000;

    %% Client Phase
    User([User]) ::: user
    Cart[View Cart] ::: user
    Checkout[Click Checkout] ::: user
    
    User --> Cart --> Checkout
    
    %% Backend Checkout Phase
    subgraph Backend_Checkout [1. Checkout API Phase]
        LockDB{Inventory Available?} ::: decision
        Reserve[Reserve Inventory & Lock] ::: db
        InsufStock[Throw Insufficient Stock Error] ::: error
        
        CallStripe{Stripe API Success?} ::: decision
        GenURL[Generate Checkout Session] ::: success
        StripeError[500 API Error] ::: error
    end
    
    Checkout --> LockDB
    LockDB -- No --> InsufStock
    LockDB -- Yes --> Reserve
    Reserve --> CallStripe
    CallStripe -- No --> StripeError
    CallStripe -- Yes --> GenURL
    GenURL --> Redirect([Redirect to Stripe Hosted Page]) ::: external

    %% Webhook Ingestion Phase
    Webhook([Stripe Async Webhook]) ::: external
    Redirect -.-> |User Pays on Stripe| Webhook
    
    subgraph Backend_Webhook [2. Webhook Ingestion Phase]
        ValSig{Valid Signature?} ::: decision
        SigErr[Reject 400 Invalid] ::: error
        
        Idempotent{Event Already in DB?} ::: decision
        IgnoreDup[Ignore & Proceed] ::: success
        InsertEvent[Insert to processed_webhook_events] ::: db
        
        PushRedis{Redis Online?} ::: decision
        Enqueue[Push to BullMQ] ::: worker
        RedisErr[Return 500 - Stripe Will Retry] ::: error
    end
    
    Webhook --> ValSig
    ValSig -- No --> SigErr
    ValSig -- Yes --> Idempotent
    
    Idempotent -- Yes --> IgnoreDup
    Idempotent -- No --> InsertEvent
    
    InsertEvent --> PushRedis
    IgnoreDup --> PushRedis
    
    PushRedis -- No --> RedisErr
    PushRedis -- Yes --> Enqueue
    
    %% Background Worker Phase
    subgraph Agent_Processing [3. BullMQ Payment Worker]
        Dequeue[Worker Picks Up Job] ::: worker
        UpdateOrder[Lock & Update Order to PAID] ::: db
        ConfirmRes[Confirm Reservations] ::: db
    end
    
    Enqueue --> Dequeue
    Dequeue --> UpdateOrder --> ConfirmRes
    ConfirmRes --> Notify([Send Success Email]) ::: external
```

---

## 2. System Failure & Recovery Flow (Redis Crash)

This flowchart specifically highlights what happens to your system's data integrity when Redis (your queue) goes offline and how it perfectly recovers using PostgreSQL as an outbox.

```mermaid
flowchart TD
    %% Styling Classes
    classDef user fill:#bae6fd,stroke:#0369a1,stroke-width:2px,color:#000;
    classDef db fill:#fef08a,stroke:#a16207,stroke-width:2px,color:#000;
    classDef error fill:#fecaca,stroke:#b91c1c,stroke-width:2px,color:#000;
    classDef external fill:#e5e7eb,stroke:#374151,stroke-width:2px,color:#000;
    classDef decision fill:#fed7aa,stroke:#c2410c,stroke-width:2px,color:#000;
    classDef success fill:#a7f3d0,stroke:#047857,stroke-width:2px,color:#000;

    StripeHook([Stripe sends Webhook]) ::: external
    VerifySig[Verify Signature] ::: user
    
    InsertDB{Insert into Postgres} ::: decision
    DupCheck[Duplicate Event Ignored] ::: success
    StoreSuccess[Stored Durably in Outbox] ::: db
    
    RedisCheck{Redis BullMQ Online?} ::: decision
    
    PushRedis[Push to BullMQ Queue] ::: user
    QueueSuccess[Return 200 OK to Stripe] ::: success
    
    RedisFail[Return 500 to Stripe] ::: error
    StripeRetry([Stripe Retries 1 Hour Later]) ::: external

    StripeHook --> VerifySig
    VerifySig --> InsertDB
    
    InsertDB -- "Success (New Event)" --> StoreSuccess
    InsertDB -- "Fails (Duplicate Event)" --> DupCheck
    
    StoreSuccess --> RedisCheck
    DupCheck --> RedisCheck
    
    RedisCheck -- Yes --> PushRedis
    PushRedis --> QueueSuccess
    
    RedisCheck -- "No (CRASHED)" --> RedisFail
    RedisFail -.-> StripeRetry
    StripeRetry --> VerifySig
```

---

## 3. Self-Healing Expiration Flow

This flowchart shows how the database-backed sweeper automatically cleans up stalled checkouts without needing BullMQ delayed jobs.

```mermaid
flowchart TD
    %% Styling Classes
    classDef db fill:#fef08a,stroke:#a16207,stroke-width:2px,color:#000;
    classDef decision fill:#fed7aa,stroke:#c2410c,stroke-width:2px,color:#000;
    classDef success fill:#a7f3d0,stroke:#047857,stroke-width:2px,color:#000;
    classDef sweeper fill:#e9d5ff,stroke:#7e22ce,stroke-width:2px,color:#000;
    classDef error fill:#fecaca,stroke:#b91c1c,stroke-width:2px,color:#000;

    StartSweeper([Cron Runs Every 60s]) ::: sweeper
    FindExp{Expired Reservations Found?} ::: decision
    
    LockRows[FOR UPDATE SKIP LOCKED] ::: db
    
    PaidCheck{Is Order Already Paid?} ::: decision
    
    CancelOrder[Transition Order to CANCELED] ::: db
    ReleaseInv[Release Inventory to Available] ::: success
    
    ConfirmHold[Transition to CONFIRMED_SOLD] ::: success
    
    End([Finish Sweep]) ::: sweeper

    StartSweeper --> FindExp
    FindExp -- No --> End
    FindExp -- Yes --> LockRows
    
    LockRows --> PaidCheck
    
    PaidCheck -- "No (User Abandoned Cart)" --> CancelOrder
    CancelOrder --> ReleaseInv
    ReleaseInv --> End
    
    PaidCheck -- "Yes (Payment won the race)" --> ConfirmHold
    ConfirmHold --> End
```
