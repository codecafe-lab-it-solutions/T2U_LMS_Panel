# T2U LMS Panel

An enterprise-grade Learning Management System (LMS), MLM/Direct Selling Binary Compensation Engine, and ERP Platform built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, and **Express + Prisma + PostgreSQL**.

> 📖 **Full Project Documentation:** For a comprehensive architectural breakdown, database models, compensation logic, and directory overview, please refer to [PROJECT_KNOWLEDGE_BASE.md](PROJECT_KNOWLEDGE_BASE.md).

---

## Quick Start Guide

### 1. Prerequisites
- **Node.js** (v20+ or v24+ recommended)
- **npm** (v10+ or v11+)
- **PostgreSQL** (optional for live backend database persistence; app includes offline demo mode)

---

### 2. Installation

Install dependencies for both the frontend client and the backend server:

```bash
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies
cd server
npm install
npm run db:generate
cd ..
```

---

### 3. Environment Configuration

Copy the example configuration files or customize them as needed:
- Frontend: `.env`
  ```env
  VITE_API_URL=http://localhost:4000/api
  APP_URL=http://localhost:3000
  ```
- Backend: `server/.env`
  ```env
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/t2u_lms"
  JWT_SECRET="dev-secret-jwt-key-t2u-lms-2026"
  PORT=4000
  FRONTEND_URL="http://localhost:3000"
  ZOOM_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  UPLOAD_DIR="./uploads"
  ```

---

### 4. Running the Development Servers

#### Frontend Development Server:
```bash
npm run dev
```
Accessible at [http://localhost:3000](http://localhost:3000).

#### Backend API Server:
```bash
cd server
npm run dev
```
Accessible at [http://localhost:4000](http://localhost:4000) (Health check: [http://localhost:4000/health](http://localhost:4000/health)).

---

## Default Demo Logins

| Role | Username / Email | Password | Referral Code |
|---|---|---|---|
| **Super Admin** | `admin@t2upgrade.com` | `admin@t2u` (or `password`) | `T2U1000` |
| **Instructor** | `instructor@t2upgrade.com` | `password` | `T2UINSTR01` |
| **Student** | `student@t2upgrade.com` | `password` | `T2USTU001` |

---

## Production Build & Verification

```bash
# Type check all TypeScript files
npm run lint

# Compile production bundle
npm run build
```
Production deployment configurations for PM2 and Nginx are located in `ecosystem.config.cjs` and `nginx.conf`.
