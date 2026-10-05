<img width="1917" height="1026" alt="9" src="https://github.com/user-attachments/assets/677574b4-a93c-4b6c-a62e-2f9bc9f71355" />
# ⚽ Legacy XI 2.0 — Beyond CRUD

### A Full-Stack Football Jersey E-Commerce Platform

Legacy XI 2.0 is a full-stack football jersey e-commerce platform designed to deliver a smooth shopping experience while exploring practical backend engineering challenges.

Beyond basic CRUD operations, the project focuses on inventory management, concurrent purchase handling, payment webhook idempotency, asynchronous job processing, retry strategies, and reservation expiration.

<p align="center">
  <a href="https://legacy-xi-2-0-psi.vercel.app/">🌐 Live Demo</a> •
  <a href="https://github.com/Omkar-XD/legacy-XI-2.0">💻 GitHub Repository</a>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Backend Engineering Concepts](#-backend-engineering-concepts)
- [System Architecture](#-system-architecture)
- [Technology Stack](#-technology-stack)
- [Core Workflows](#-core-workflows)
- [Project Structure](#-project-structure)
- [Installation and Setup](#-installation-and-setup)
- [Deployment](#-deployment)
- [Architectural Trade-Offs](#-architectural-trade-offs)
- [Future Improvements](#-future-improvements)
- [Contributing](#-contributing)
- [Author](#-author)

---

## 🌟 Overview

Legacy XI 2.0 is built for football fans who want to explore and shop for football jerseys through a modern e-commerce experience.

The project also explores backend engineering beyond basic CRUD, including asynchronous jobs, payment event processing, inventory consistency, and reservation lifecycle management.

### Project Links

| Resource | Link |
|---|---|
| Live Website | [Open Legacy XI 2.0](https://legacy-xi-2-0-psi.vercel.app/) |
| GitHub Repository | [View Source Code](https://github.com/Omkar-XD/legacy-XI-2.0) |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

---

## ✨ Features

### 🛍️ E-Commerce Experience

- Browse football jerseys and explore product details.
- Search and navigate the product catalog.
- Manage shopping cart items and checkout workflows.
- Responsive shopping experience for desktop and mobile devices.

### 💳 Payment Integration

- Stripe and Razorpay payment integrations.
- Payment webhook handling for asynchronous payment events.
- Backend processing of payment status updates.
- Persisted webhook event tracking for duplicate-event handling.

### 📦 Inventory and Reservation Management

- Product inventory and order-related reservation management.
- Database concurrency controls where implemented.
- Reservation expiration and pending-order cleanup.
- Inventory consistency during checkout workflows.

### ⚡ Background Processing

- Redis and BullMQ for background job processing.
- Asynchronous processing for eligible tasks.
- Configurable retries and backoff strategies.
- Background workers for configured payment and reservation workflows.

### 🖼️ Media and Deployment

- Cloudinary for product media management.
- PostgreSQL for relational data persistence.
- Vercel for frontend hosting.
- Render for backend hosting.

---

## 📸 Screenshots

Screenshots of the actual application help visitors understand the interface, shopping experience, and major features without running the project locally.

### 🏠 Home Page

Showcase the landing page, navigation, featured football jerseys, and overall design.

<img width="1917" height="1027" alt="1" src="https://github.com/user-attachments/assets/4d795932-35d1-471d-9028-5a08808121fe" />

### 🛍️ Product Listing

Show the product catalog, jersey cards, prices, filters, and browsing experience.

<img width="1917" height="1022" alt="2" src="https://github.com/user-attachments/assets/b43049e6-1b56-4598-9bc4-62c110073c53" />

### 👕 Product Details

Show a jersey's images, available sizes, pricing, and product information.

<img width="1917" height="1027" alt="3" src="https://github.com/user-attachments/assets/fbdf8fc5-c92e-4a33-8bd8-5863cf67bef5" />

### 🛒 Shopping Cart

Show selected products, quantities, prices, and the cart summary.

<img width="1917" height="1030" alt="4" src="https://github.com/user-attachments/assets/b2d480fa-39ba-4576-9be9-7a40291ce87b" />

### 💳 Checkout and Payments

Show the checkout interface and payment options. Do not include real payment credentials or sensitive customer information.

<img width="1907" height="1031" alt="5" src="https://github.com/user-attachments/assets/853aafbb-9d41-4faf-b0ec-60cec56c373f" />
<img width="1917" height="1027" alt="6" src="https://github.com/user-attachments/assets/8c4dd76b-e595-4e4d-b433-bab0046f840c" />
<img width="1917" height="1026" alt="7" src="https://github.com/user-attachments/assets/62bc7dff-71e8-4ccc-b212-82e5e59eb044" />

### 📦 Order Management

Show order information and order status if this functionality is available in your application.

<img width="1912" height="970" alt="11" src="https://github.com/user-attachments/assets/76dfc0d1-8f0f-45c2-8523-6585b246dea0" />

### 📱 Responsive Design

Show the mobile layout to demonstrate how the storefront adapts to smaller screens.

<img width="720" height="1600" alt="13" src="https://github.com/user-attachments/assets/41c9d349-612f-4c31-b6a1-c6ec09569e1b" />

### ⚙️ Backend Engineering

<img width="1912" height="1032" alt="8" src="https://github.com/user-attachments/assets/8c5e9f77-d60a-4462-9c12-3911e6f9d1e7" />
<img width="1917" height="1026" alt="9" src="https://github.com/user-attachments/assets/65cb5ab7-5d24-4777-9cf0-e0a2849dea98" />
<img width="1917" height="972" alt="10" src="https://github.com/user-attachments/assets/572b735e-8161-4e78-814e-f493b85b8e18" />
<img width="1917" height="967" alt="12" src="https://github.com/user-attachments/assets/2b2f5bfc-fc2e-47ed-b2c0-aba94872cb36" />


## ⚙️ Backend Engineering Concepts

### 1. Inventory Concurrency Control

When multiple customers attempt to purchase the same limited-stock product, concurrent requests can cause incorrect inventory updates if stock is modified without appropriate protection.

The backend uses database-level consistency mechanisms where implemented to help protect inventory and order workflows.

**Engineering goal:** Prevent overselling and preserve inventory consistency under concurrent requests.

### 2. Payment Webhook Idempotency

Payment providers may deliver the same webhook more than once. Processing duplicate events without protection can result in repeated business operations.

The project uses persisted webhook event records and processing status tracking as part of its idempotency workflow.

**Engineering goal:** Avoid repeating the same payment-related operation when an event is delivered multiple times.

> End-to-end idempotency depends on atomic event claiming, appropriate database constraints, and safe business-operation handling. Verify these guarantees through implementation review and concurrent tests.

### 3. Asynchronous Job Processing

Some tasks do not need to finish during the customer's HTTP request. Background queues allow eligible work to be processed separately.

BullMQ uses Redis to manage jobs and coordinate background processing.

**Engineering goal:** Separate suitable background work from request handling and improve resilience to transient failures.

### 4. Retry and Backoff Strategies

Transient failures can occur when interacting with external services or processing queued jobs.

Configurable retries and exponential backoff can reduce repeated attempts and give temporary failures time to recover.

**Engineering goal:** Improve recovery from transient errors while avoiding uncontrolled retry loops.

### 5. Reservation Expiration and Recovery

Reservations can become stale when checkout is abandoned or payment does not complete within the allowed period.

A scheduled background process can identify expired reservations and perform the appropriate cleanup or order-state transitions.

**Engineering goal:** Recover inventory safely and prevent abandoned reservations from remaining active indefinitely.

### 6. Database Consistency and Failure Handling

Payment processing, order updates, inventory changes, and reservation cleanup may interact with one another.

These workflows require careful transaction boundaries, consistent lock ordering, failure recovery, and duplicate-event protection.

**Engineering goal:** Keep related business records consistent even when requests overlap or background jobs fail.

---

## 🏗️ System Architecture

The platform connects the frontend, backend API, relational database, payment providers, media storage, and background processing infrastructure.

```mermaid
flowchart TD
    CUSTOMER[Customer] --> FRONTEND[React Frontend]
    FRONTEND --> API[Node.js and Express API]

    API --> DATABASE[(PostgreSQL)]
    API --> PAYMENTS[Stripe and Razorpay]
    API --> MEDIA[Cloudinary]
    API --> QUEUE[BullMQ Job Queue]

    QUEUE --> REDIS[(Redis)]
    REDIS --> WORKERS[Background Workers]
    WORKERS --> DATABASE
```

### Architecture Components

| Component | Responsibility |
|---|---|
| React frontend | Product browsing, cart, checkout, and user interface |
| Node.js and Express | API endpoints and backend business logic |
| PostgreSQL | Persistent relational data |
| Redis | Queue infrastructure for BullMQ |
| BullMQ workers | Asynchronous job processing |
| Stripe and Razorpay | Payment processing and payment events |
| Cloudinary | Product image and media management |
| Vercel and Render | Frontend and backend hosting |

*This is a high-level representation. Actual request flows and deployed integrations depend on the current implementation and environment configuration.*

---

## 🛠️ Technology Stack

### Frontend

- **React** — Component-based user interface.
- **Tailwind CSS** — Utility-first styling.
- **shadcn/ui** — Reusable interface components.
- **JavaScript / TypeScript** — Use the languages present in the frontend codebase.

### Backend

- **Node.js** — JavaScript runtime.
- **Express.js** — HTTP routing and middleware.
- **BullMQ** — Background job queue management.
- **Redis** — Queue storage and coordination.

### Database and Integrations

- **PostgreSQL** — Relational database.
- **Stripe** — Payment integration.
- **Razorpay** — Payment integration.
- **Cloudinary** — Media storage and delivery.

### Deployment

- **Vercel** — Frontend hosting.
- **Render** — Backend hosting.

---

## 🔄 Core Workflows

### Customer Purchase Workflow

1. The customer browses available football jerseys.
2. The customer selects a product and proceeds to checkout.
3. The backend validates the order and relevant inventory state.
4. The payment provider processes the payment.
5. The backend receives and processes the relevant payment event.
6. Order and inventory states are updated according to the implemented workflow.
7. Eligible background jobs handle asynchronous tasks.

### Payment Webhook Workflow

1. A payment provider sends a webhook to the backend.
2. The backend validates the webhook according to provider requirements.
3. The event is recorded for processing.
4. The event is queued or processed through the configured workflow.
5. The worker performs the required business operations.
6. Processing status is updated to support recovery and duplicate-event handling.

### Reservation Expiration Workflow

1. A reservation is created as part of the checkout workflow.
2. The reservation remains active for its configured lifetime.
3. A background process identifies expired reservations.
4. The backend checks the associated order and payment state.
5. Eligible reservations are cleaned up and inventory is handled according to the implemented rules.

---

## 📁 Project Structure

The following is a representative structure. Update it to match the actual repository.

```text
legacy-XI-2.0/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── db/
│   │   ├── modules/
│   │   ├── workers/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── screenshots/
│   ├── home.png
│   ├── products.png
│   ├── product-details.png
│   ├── cart.png
│   ├── checkout.png
│   ├── orders.png
│   ├── mobile.png
│   └── backend-monitoring.png
│
└── README.md
```

---

## 🚀 Installation and Setup

### Prerequisites

- [Node.js](https://nodejs.org/)
- npm
- [Git](https://git-scm.com/)
- PostgreSQL
- Redis, if required by the configured background processing workflows

### Step 1: Clone the Repository

```bash
git clone https://github.com/Omkar-XD/legacy-XI-2.0.git
cd legacy-XI-2.0
```

### Step 2: Install Dependencies

Install frontend dependencies:

```bash
cd frontend
npm install
```

Install backend dependencies:

```bash
cd ../backend
npm install
```

### Step 3: Configure Environment Variables

Create the appropriate environment files using the variable names expected by the application.

The following is an illustrative example:

```env
# Database
DATABASE_URL=

# Redis
REDIS_URL=

# Authentication
JWT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Important:** Verify the exact variable names in the backend configuration and `.env.example` files. Never commit real credentials or secret keys to GitHub.

### Step 4: Start the Application

Start the backend using the development script defined in its `package.json`:

```bash
cd backend
npm run dev
```

In another terminal, start the frontend using its configured development script:

```bash
cd frontend
npm run dev
```

If either project uses a different script name, use the corresponding command from that directory's `package.json`.

Open the local frontend URL printed in the terminal.

---

## ☁️ Deployment

- **Frontend:** [Legacy XI 2.0](https://legacy-xi-2-0-psi.vercel.app/)
- **Backend:** [Legacy XI Backend](https://legacy-xi-backend.onrender.com/)
- **GitHub Repository:** [Omkar-XD/legacy-XI-2.0](https://github.com/Omkar-XD/legacy-XI-2.0)

The frontend and backend are deployed separately. Successful operation depends on correct environment variables, database connectivity, payment-provider configuration, and background worker setup.

---

## ⚖️ Architectural Trade-Offs

### 1. Relational Database vs. In-Memory State

PostgreSQL provides durable relational storage and transactional capabilities for orders, inventory, and payment-related records. It requires appropriate indexing, transaction design, and query optimization as the application grows.

### 2. Synchronous Requests vs. Background Jobs

Synchronous processing can be simpler for immediate customer-facing operations. Background queues are useful for eligible work that can be processed asynchronously, but introduce additional requirements such as retries, job monitoring, and duplicate-processing protection.

### 3. Reliability vs. Operational Complexity

Payment events, reservation expiration, and inventory updates require robust recovery mechanisms. Queues and workers provide additional recovery options but also introduce more components to test and maintain.

### 4. External Payment Providers

Integrating payment services avoids implementing payment processing from scratch. However, webhooks can be delayed, duplicated, or delivered out of order, so the backend must validate events and handle state transitions carefully.

---

## 🔮 Future Improvements

- Add automated concurrency tests for competing purchases.
- Test duplicate and out-of-order payment webhooks.
- Strengthen atomic idempotency using appropriate database constraints and transaction boundaries.
- Standardize database lock ordering across payment and reservation workflows.
- Add queue monitoring, structured logs, and actionable failure alerts.
- Introduce integration tests for payment-versus-expiration races.
- Improve API rate limiting, validation, and security testing.
- Add performance benchmarks for high-concurrency checkout scenarios.
- Improve automated deployment checks and production readiness monitoring.

These are potential improvements, not claims that the corresponding functionality is already complete.

---

## 🤝 Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```

3. Commit your changes:

   ```bash
   git commit -m "feat: describe your change"
   ```

4. Push your branch:

   ```bash
   git push origin feature/your-feature
   ```

5. Open a Pull Request.

---

## 👨‍💻 Author

**Omkar Chavan**

- GitHub: [@Omkar-XD](https://github.com/Omkar-XD)
- Project: [Legacy XI 2.0](https://github.com/Omkar-XD/legacy-XI-2.0)

---

<p align="center">
  Built with ⚽ and a focus on reliable backend engineering.
</p>
