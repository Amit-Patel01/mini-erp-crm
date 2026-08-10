# Mini ERP + CRM Operations Portal

A production-ready, full-stack **Wholesale & Distribution Operations Management Portal** featuring Customer CRM with follow-up tracking, Product Inventory with low-stock alerts, Sales Delivery Challan generation with auto-numbering, transactional stock locking, print-to-PDF invoice engine, Admin User Management & Password Reset, Role-Based Access Control (RBAC), and a real-time operations analytics dashboard.

---

## Technical Architecture

```text
React + Vite (Frontend - Vercel)
       ↓
Axios + JWT Auth
       ↓
Express + TypeScript (Backend - Render)
       ↓
Prisma ORM
       ↓
PostgreSQL 16 (Neon / Docker Container)
```

---

## System Requirements

- **Docker Desktop** (or Docker Engine with Docker Compose)
- **Node.js** (v18.x or v20.x recommended)
- **npm** (v9.x or higher)

*(Note: PostgreSQL 16 is hosted inside a Docker container locally or via Neon.tech in cloud deployment. No native local installation of PostgreSQL or `psql` is required on Windows).*

---

## Core Modules & Capabilities

### 1. Modern Light Theme UI System & Global Branding
- Clean white layout, sleek horizontal top navbar navigation with user popover menu.
- Customizable Corporate Branding (Logo, Title, Favicon) and Operating Country / Global Currency selection (`INR ₹`, `USD $`, `EUR €`, `GBP £`, `AED د.إ`, `JPY ¥`, etc.).

### 2. Authentication, Roles & Admin User Management
- **Role-Based Access Control**: Configurable roles (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`).
- **Admin User Management**: System Administrator can view all team members, create new accounts, reset user passwords, and remove user accounts directly from the Settings portal (`/api/users`).

### 3. Customer CRM & Follow-Up Tracking
- Filterable wholesale customer directory with search across name, business, phone, and email.
- Status filters (`LEAD`, `ACTIVE`, `INACTIVE`) and customer type filters (`WHOLESALE`, `RETAIL`, `DISTRIBUTOR`).
- Slide-over Customer Details drawer with real-time follow-up note logging and timeline history.

### 4. Product Inventory & Low-Stock Alerts
- Catalog management with SKU codes, categories, unit prices, and warehouse locations.
- **Low-Stock Alerting**: Automatic warning indicators when `currentStock <= minimumStock`.
- Manual Stock Adjustment modal (Stock Inward `IN` / Stock Outward `OUT`) with mandatory reference reasons.
- Dedicated **Stock Movement Audit Feed** tracking all inventory transactions.

### 5. Sales Delivery Challans, Stock Locking & A4 Invoice Printing
- Sequential auto-numbering generation (`CH-2026-0001`).
- Line item pricing, SKU, and product name snapshotting.
- **Atomic `$transaction` Stock Locking**: Confirming a sales challan checks stock for every line item inside a database transaction. If inventory is insufficient for any item, the entire transaction rolls back cleanly with HTTP 400 details (`{ success: false, message: "...", available: X, requested: Y }`).
- **A4 Delivery Challan Printing**: High-resolution print engine for delivery challans.
- Reversibility: Cancelling a confirmed challan automatically restores stock back to inventory and logs an `IN` movement.

### 6. Operations Dashboard
- Real-time metric cards (Total Customers, Total SKUs, Low Stock Alert Count, Confirmed Sales Revenue).
- Interactive widgets: Low stock replenishment panel, CRM follow-ups due today, recent challans table, and audit log.

---

## System Administrator Credentials

| Role | Name | Email | Password | Allowed Portal Capabilities |
|---|---|---|---|---|
| **ADMIN** | System Admin | `admin@example.com` | `Admin@123` | Full access across all portal modules & Admin User Management |

---

## Environment Setup (`backend/.env`)

```env
PORT=5000
DATABASE_URL="postgresql://neondb_owner:pass@avc-twilight-fog-avlj1355.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="mini_erp_crm_super_secret_jwt_key_2026_production"
JWT_EXPIRES_IN="24h"
CLIENT_URL="http://localhost:3000"
```

---

## Quick Start Guide

### 1. PostgreSQL Docker Container Setup

Start the PostgreSQL 16 Alpine container running in Docker locally:

```bash
docker compose up postgres -d
```

Verify container status:

```bash
docker ps
```

### 2. Backend API Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Generate Prisma Client for PostgreSQL
npx prisma generate

# Sync schema with PostgreSQL database
npx prisma db push

# Seed initial System Admin user
npm run seed

# Run backend development server
npm run dev
```

The Express API server will start on **`http://localhost:5000`**.

### 3. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run frontend development server
npm run dev
```

The Vite React application will start on **`http://localhost:3000`**.

---

## API Endpoints Reference

### Authentication & Profile (`/api/auth`)
- `POST /api/auth/login`: Authenticate user with email and password. Returns JWT token and user profile.
- `PUT /api/auth/profile`: Update user profile name, email ID, and password.
- `GET /api/auth/me`: Get profile details of the logged-in user.

### Admin User Management (`/api/users`)
- `GET /api/users`: Get list of all registered team users (Admin only).
- `POST /api/users`: Create a new user account with initial password (Admin only).
- `PUT /api/users/:id/reset-password`: Reset user password (Admin only).
- `DELETE /api/users/:id`: Delete a user account (Admin only).

### Customer CRM (`/api/customers`)
- `GET /api/customers`: List customers with optional `search`, `status`, `customerType`, `page`, `limit`.
- `GET /api/customers/:id`: Get detailed customer profile with follow-up history and recent challans.
- `POST /api/customers`: Create a new customer record.
- `PUT /api/customers/:id`: Update customer details.
- `DELETE /api/customers/:id`: Delete a customer record (Admin only).
- `POST /api/customers/:id/follow-up`: Log a new follow-up note and update scheduled follow-up date.
- `GET /api/customers/:id/follow-ups`: Retrieve follow-up history timeline for a customer.

### Products & Inventory (`/api/products`)
- `GET /api/products`: List product catalog with optional `search`, `category`, `lowStock=true`.
- `GET /api/products/:id`: Get product details.
- `POST /api/products`: Add a new product SKU (Admin/Warehouse).
- `PUT /api/products/:id`: Update product details (Admin/Warehouse).
- `DELETE /api/products/:id`: Delete a product SKU (Admin only).

### Stock Movements (`/api/stock-movements`)
- `GET /api/stock-movements`: List inventory inward/outward audit logs.
- `POST /api/stock-movements`: Perform manual stock adjustment (`IN` or `OUT`) with mandatory reason.

### Sales Challans (`/api/challans`)
- `GET /api/challans`: List sales delivery challans with optional `status` (`DRAFT`, `CONFIRMED`, `CANCELLED`) and `search`.
- `GET /api/challans/:id`: Get complete challan details with line items and customer info.
- `POST /api/challans`: Create a new Draft or Confirmed Sales Challan with line item price snapshots.
- `POST /api/challans/:id/confirm`: Execute atomic database transaction to lock stock and update status to `CONFIRMED`.
- `POST /api/challans/:id/cancel`: Cancel a challan and reverse stock back to inventory if previously confirmed.

### Dashboard Analytics (`/api/dashboard`)
- `GET /api/dashboard/stats`: Retrieve aggregate metrics, low-stock alerts, follow-ups due today, recent challans, and stock movements.

---

## Postman API Collection

A ready-to-import Postman collection is included in the project root:
- `mini_erp_crm.postman_collection.json`

---

## Live Cloud Deployment & Docker Notes

See [DEPLOYMENT.md](file:///d:/Myproject/erp+crm/DEPLOYMENT.md) for full step-by-step cloud deployment instructions:
- **Database**: Managed PostgreSQL 16 on Neon.tech.
- **Backend**: Containerized Express API Web Service on Render.com.
- **Frontend**: Vite React static deployment on Vercel.com with SPA rewrites (`vercel.json`).
