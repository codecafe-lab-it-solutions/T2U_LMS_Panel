# T2U LMS Panel — Comprehensive Project Knowledge Base & Setup Guide

---

## 1. Executive Summary & Overview

**T2U LMS Panel** is an enterprise-grade, full-stack educational and business management platform that seamlessly combines:
1. **Learning Management System (LMS)**: Structured courses, chapter-wise lessons (video, PDF, text), quizzes, assignments, certificate generation, and live interactive classes (Zoom integration).
2. **Direct Selling / MLM Compensation Engine**: Binary genealogy trees (left/right legs), Business Volume (BV) tracking, Direct Sponsor Income (DSI), generation bonuses, matching bonuses, car/house funds, and automated payout calculation.
3. **Enterprise Resource Planning (ERP) & Compliance**: Multi-tier KYC verification (Aadhaar, PAN, Bank Passbook), GST invoicing, tax reports, support ticketing, expense tracking, and employee payroll management.
4. **Public Marketing Portal**: A modern, dynamic public landing page with product showcases, course bundles, testimonials, and self-service registration.

The application operates in a **dual-mode architecture**:
- **Connected Mode**: Fully connected to the Node.js/Express backend, PostgreSQL database, and Prisma ORM for end-to-end data persistence and business logic.
- **Demo / Standalone Mode**: Equipped with built-in client-side mock data and Zustand state persistence so developers and stakeholders can test student, instructor, and admin flows even without a local PostgreSQL database running.

---

## 2. Technology Stack

### Frontend (Root Workspace)
| Layer | Technologies |
|---|---|
| **Framework & Language** | React 19, TypeScript 5.8, Vite 6 |
| **State Management** | Zustand 5 with `persist` local-storage middleware |
| **Data Fetching** | TanStack React Query 5 |
| **Styling & UI** | Tailwind CSS v4 (`@tailwindcss/vite`), Base UI / Radix primitives, Lucide Icons |
| **Animations** | Motion (Framer Motion v12) |
| **Data Visualization** | Recharts (dynamic charts for BV, earnings, and analytics) |
| **PDF Generation** | jsPDF, html2canvas (invoices, certificates, audit reports) |

### Backend (`server/` Directory)
| Layer | Technologies |
|---|---|
| **Runtime & Framework** | Node.js (v20+ / v24+), Express 4.21 |
| **ORM & Database** | Prisma ORM 5.22, PostgreSQL |
| **Authentication & Security** | JWT (`jsonwebtoken`), bcryptjs password hashing, AES-256 Zoom secret encryption |
| **Scheduling** | `node-cron` (automated weekly binary BV matching every Sunday 00:30 IST) |
| **File Storage** | Multer local upload handling (`/api/upload`) |
| **Integrations** | Zoom OAuth2 & Webhooks (HMAC verification), Twilio (SMS), Nodemailer (Email) |

---

## 3. System Architecture & Roles

```mermaid
graph TD
    Client["Vite + React 19 Frontend (Port 3000)"]
    API["Express 4 API Server (Port 4000)"]
    DB[(PostgreSQL via Prisma ORM)]
    Cron["Node-Cron Scheduler (Weekly BV Matching)"]
    Zoom["Zoom API & Webhooks"]

    Client -->|REST API / JWT| API
    API -->|Prisma Client| DB
    API --> Cron
    API --> Zoom
```

### User Roles & Permissions

| Role | Access Scope & Key Modules |
|---|---|
| **Student** | Course learning workspace, chapter progress, quizzes & assignments, certificate generator, Genealogy binary tree, BV ledger, commission summary, withdrawal requests, KYC upload, bundle enrollment, support tickets, product shop, invoices. |
| **Instructor** | Course creation & editing, batch creation & scheduling, live class host (Zoom), assignment grading, quiz manager, student analytics, instructor earnings & withdrawals. |
| **Super Admin** | Full platform control: user management, course approval, bundle pricing, MLM plan configuration (BV ratios, DSI, funds), KYC approvals/rejections, financial overview, GST/tax reports, employee roles & payroll, Zoom credentials manager, system settings. |
| **Employee** | Granular role-based access without super admin credentials (e.g., Support agent, KYC verification officer, Course reviewer, Accounts clerk). |
| **Guest / Visitor** | Public landing page, course catalogs, package pricing, self-service registration and login. |

---

## 4. Repository & Directory Structure

```
T2U_LMS_Panel/
├── .env.example                     # Example frontend environment variables
├── .env                             # Active frontend environment variables
├── package.json                     # Frontend dependencies & scripts
├── vite.config.ts                   # Vite configuration (aliases, chunk splitting)
├── tsconfig.json                    # TypeScript compiler options
├── ecosystem.config.cjs             # PM2 production configuration for both apps
├── nginx.conf                       # Nginx reverse proxy configuration
│
├── public/                          # Static public assets (favicons, images)
├── scripts/
│   └── post-deploy.sh               # Production build & PM2 reload automation
│
├── src/                             # Frontend Source Code
│   ├── App.tsx                      # Root component, hash router, role dispatcher
│   ├── main.tsx                     # React application entry point
│   ├── index.css                    # Tailwind CSS v4 styling & variables
│   ├── types.ts                     # Core TypeScript type definitions
│   ├── landing-data.ts              # Content data for the public marketing site
│   │
│   ├── components/                  # Main UI Views & Modules
│   │   ├── admin/                   # 44+ Super Admin ERP & Management components
│   │   ├── employee/                # Employee management & role delegation
│   │   ├── landing/                 # Public site components (hero, stats, packages)
│   │   ├── ui/                      # Base UI / Radix primitives (Button, Dialog, Card)
│   │   ├── GenealogyTree.tsx        # Interactive MLM binary network visualization
│   │   ├── HomeDashboard.tsx        # Student personalized overview dashboard
│   │   ├── IncomeDashboard.tsx      # Comprehensive earnings & withdrawal interface
│   │   ├── KYCVerification.tsx      # Multi-step Aadhaar/PAN/Bank KYC form
│   │   ├── LearningSection.tsx      # Enrolled course viewer & chapter player
│   │   ├── LiveClassManagement.tsx  # Zoom live classes schedule & joining
│   │   ├── LoginPage.tsx            # Multi-portal login, registration, password reset
│   │   ├── ProductShop.tsx          # Physical / digital course kit shop
│   │   ├── PublicSite.tsx           # Public marketing landing page
│   │   ├── QuizTakingPage.tsx       # Student interactive quiz attempt screen
│   │   ├── StudentModules.tsx       # Certificates, assignments, team list, settings
│   │   └── SupportPage.tsx          # User support ticket raising & tracking
│   │
│   ├── services/
│   │   ├── api.ts                   # Complete client API adapter (30+ endpoints)
│   │   └── mockApi.ts               # Standalone mock data adapter for demo mode
│   │
│   └── store/
│       └── useAppStore.ts           # Central Zustand store (auth, courses, MLM, KYC)
│
└── server/                          # Backend API Server
    ├── .env.example                 # Example server environment variables
    ├── .env                         # Active server environment variables
    ├── package.json                 # Express dependencies & scripts
    ├── prisma/
    │   └── schema.prisma            # Prisma schema (PostgreSQL relational models)
    │
    ├── scripts/
    │   ├── auditBinaryTreePlacement.js     # Validates binary network integrity
    │   └── repairBinaryTreeViolations.js   # Fixes tree placement anomalies
    │
    └── src/
        ├── index.js                 # Express server entry point & middleware
        ├── scheduler.js             # Node-cron weekly automated BV calculation
        ├── seed.js                  # Database seed script with sample data
        ├── generated/prisma/        # Generated Prisma Client output
        ├── middleware/              # JWT auth and employee permission guards
        ├── routes/                  # 34 Express route handlers (auth, mlm, kyc, etc.)
        └── zoom/                    # Zoom OAuth, webhook, and meeting controllers
```

---

## 5. MLM & Compensation Mechanics

The platform embeds a high-throughput binary network compensation algorithm:
1. **Business Volume (BV)**: Each enrolled course or package has an assigned BV.
2. **Binary Tree Placement**:
   - Each node in the tree has at most two children (`left` and `right`).
   - Downlines are placed under an existing sponsor or spillover parent.
3. **Matching Bonus**:
   - Every week (Sunday at 00:30 IST via `server/src/scheduler.js`), the engine calculates matched volume: `min(left_bv, right_bv)`.
   - Matched BV converts to a monetary bonus according to the configured package percentage.
   - Remaining unmatched BV carries forward to the weaker or stronger leg.
4. **Direct Sponsor Income (DSI)**:
   - Instant direct reward credited when a direct referral purchases a package.
5. **Generation & Fund Bonuses**:
   - Generation 2 & Generation 3 overrides.
   - Car Fund, House Fund, and Royalty pools for top-tier rank achievers.

---

## 6. Getting Started & Running Locally

### Step 1: Install Dependencies
Both the frontend and backend require dependencies.

```bash
# 1. Install frontend dependencies (root folder)
npm install

# 2. Install backend dependencies (server folder)
cd server
npm install
cd ..
```

### Step 2: Environment Configuration

Ensure `.env` files are created in both the root and server folders:

#### Root Frontend `.env`:
```env
# Optional Gemini AI Key
GEMINI_API_KEY=""

# Base URL for frontend
APP_URL="http://localhost:3000"

# Backend API Endpoint
VITE_API_URL="http://localhost:4000/api"
```

#### Backend `server/.env`:
```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/t2u_lms"

# JWT secret key
JWT_SECRET="dev-secret-jwt-key-t2u-lms-2026"

# Server port
PORT=4000

# Allowed Frontend URL for CORS
FRONTEND_URL="http://localhost:3000"

# AES-256 key for Zoom secret encryption (64 hex characters)
ZOOM_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# Upload directory
UPLOAD_DIR="./uploads"
```

### Step 3: Generate Prisma Client & Database (Optional for Connected Mode)
If using PostgreSQL:
```bash
cd server
# Generate Prisma Client
npm run db:generate

# Push schema directly to database
npm run db:push

# Seed default admin, instructors, students, courses, and binary tree
npm run db:seed
cd ..
```

*Note: If PostgreSQL is not running locally, the frontend seamlessly falls back to demo mode with full interactive capabilities.*

### Step 4: Run the Development Servers

#### Terminal 1 — Start Frontend:
```bash
npm run dev
```
> The application will open on `http://localhost:3000`.

#### Terminal 2 — Start Backend:
```bash
cd server
npm run dev
```
> The Express API will listen on `http://localhost:4000`. Verify health at `http://localhost:4000/health`.

---

## 7. Default Demo & Seed Credentials

You can sign in with any of the following accounts:

| Role | Email / Username | Default Password | Referral Code | Notes |
|---|---|---|---|---|
| **Super Admin** | `admin@t2upgrade.com` or `t2u1000` | `admin@t2u` (or `password` in demo mode) | `T2U1000` | Full administrative control |
| **Instructor** | `instructor@t2upgrade.com` or `T2UINSTR01` | `password` | `T2UINSTR01` | Course creation, Zoom classes, grading |
| **Student** | `student@t2upgrade.com` or `T2USTU001` | `password` | `T2USTU001` | Course enrollment, KYC, downline tree |

---

## 8. Key NPM Scripts Reference

### Frontend (Root Workspace)
| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `vite --port=3000 --host=0.0.0.0` | Starts the Vite development server |
| `npm run build` | `vite build` | Compiles optimized production bundle into `dist/` |
| `npm run lint` | `tsc --noEmit` | Validates TypeScript types across the entire project |
| `npm run preview` | `vite preview` | Previews the production build locally |

### Backend (`server/`)
| Script | Command | Purpose |
|---|---|---|
| `npm run dev` | `nodemon src/index.js` | Starts API server with hot-reload |
| `npm start` | `node src/index.js` | Runs the API server in production mode |
| `npm run db:generate` | `prisma generate` | Generates the typed Prisma Client |
| `npm run db:push` | `prisma db push --accept-data-loss` | Pushes Prisma schema to PostgreSQL |
| `npm run db:seed` | `node src/seed.js` | Seeds initial packages, users, and binary tree |
| `npm run db:studio` | `prisma studio` | Opens Prisma GUI browser database inspector |
| `npm run audit:binary-tree-placement` | `node scripts/auditBinaryTreePlacement.js` | Audits downlines for binary placement violations |

---

## 9. Production Deployment Workflow

In production (e.g. Linux VPS or Cloud VM):
1. **PM2 Process Manager**: Configured via [`ecosystem.config.cjs`](file:///o:/Projects/T2U_LMS_Panel/ecosystem.config.cjs), running `T2U_LMS_Panel_Backend` on port 3040 and `T2U_LMS_Panel_Frontend` on port 3041.
2. **Reverse Proxy**: Handled via [`nginx.conf`](file:///o:/Projects/T2U_LMS_Panel/nginx.conf) routing `/api` to the Express backend and `/` to the frontend static server.
3. **Deployment Script**: [`scripts/post-deploy.sh`](file:///o:/Projects/T2U_LMS_Panel/scripts/post-deploy.sh) automatically runs `npm ci`, database sync, frontend builds, and restarts PM2.
