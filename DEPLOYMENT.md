# Production Deployment Guide: Mini ERP + CRM Operations Portal

This guide provides step-by-step instructions for deploying the **Mini ERP + CRM Operations Portal** live to cloud production environments using free-tier services (**Render**, **Neon/Supabase**, **Vercel**, **Docker**).

---

## 1. Database Deployment (Free Managed PostgreSQL)

You can host a managed PostgreSQL 16 database for free on **Neon.tech**, **Supabase.com**, or **Render.com**.

### Option A: Neon.tech (Recommended)
1. Sign up at [https://neon.tech](https://neon.tech).
2. Click **Create Project** -> Name it `mini-erp-crm`.
3. Copy the provided PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://<user>:<password>@<ep-hostname>.neon.tech/mini_erp?sslmode=require"
   ```

### Option B: Supabase
1. Sign up at [https://supabase.com](https://supabase.com).
2. Create a new PostgreSQL project.
3. Under **Database Settings** -> **Connection String**, copy the `URI` pooler connection string.

---

## 2. Backend Docker Container Deployment (Render.com)

Render supports direct deployment of Docker containers using your repository's `backend/Dockerfile`!

1. Push your codebase to GitHub: `https://github.com/Amit-Patel01/mini-erp-crm.git`.
2. Log into [https://render.com](https://render.com).
3. Click **New +** -> **Web Service**.
4. Select your GitHub repository.
5. Render automatically picks up `backend/Dockerfile`:
   - **Name**: `mini-erp-backend`
   - **Environment**: `Docker`
   - **Docker Context**: `backend`
   - **Dockerfile Path**: `Dockerfile`
6. Add Environment Variables:
   - `PORT`: `5000`
   - `DATABASE_URL`: *(Your Neon/Supabase PostgreSQL connection string)*
   - `JWT_SECRET`: *(A long random secret string)*
   - `JWT_EXPIRES_IN`: `24h`
   - `CLIENT_URL`: *(Your Vercel frontend URL)*
7. Click **Deploy Web Service**.

Your Dockerized backend API will be live at `https://mini-erp-backend.onrender.com`.

---

## 3. Frontend Deployment (Vercel.com)

1. Log into [https://vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Configure Framework Preset:
   - **Framework**: `Vite`
   - **Root Directory**: `frontend`
5. Add Environment Variable:
   - `VITE_API_URL`: `https://mini-erp-backend.onrender.com/api`
6. Click **Deploy**.

Your frontend UI will be live at `https://mini-erp-crm.vercel.app`.

---

## 4. Alternative Cloud Docker Deployment Options

### Option A: Railway.app (Docker Compose / Dockerfile)
1. Log into [Railway.app](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub Repo**.
3. Railway automatically detects `docker-compose.yml` and `backend/Dockerfile` and provisions the Docker containers.

### Option B: AWS ECS / ECR (AWS Elastic Container Service)
1. Push Docker image to Amazon ECR:
   ```bash
   docker build -t mini-erp-backend ./backend
   docker tag mini-erp-backend:latest <aws_account_id>.dkr.ecr.<region>.amazonaws.com/mini-erp-backend:latest
   docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/mini-erp-backend:latest
   ```
2. Launch AWS ECS Task Definition connecting to RDS PostgreSQL.

---

## 5. Post-Deployment Verification

1. Open your live Vercel URL: `https://mini-erp-crm.vercel.app`.
2. Test login using standard seeded credentials:
   - **Admin**: `admin@example.com` / `Admin@123`
   - **Sales**: `sales@example.com` / `Sales@123`
   - **Warehouse**: `warehouse@example.com` / `Warehouse@123`
   - **Accounts**: `accounts@example.com` / `Accounts@123`
3. Verify Customer CRM follow-ups, Inventory stock movements, Sales Challan auto-numbering, and Direct PDF downloading.
