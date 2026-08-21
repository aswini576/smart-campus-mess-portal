# CampusBite — Smart Campus Mess Portal

CampusBite is a full-stack campus dining application for booking meals, managing menus and inventory, reducing food waste, and monitoring operations. It provides separate student, Mess Chief, and Admin experiences backed by an Express/MongoDB API.

## Features

- Student meal booking, cancellation, recovery, feedback, and profile management.
- Mess Chief menu and ingredient CRUD, stock usage tracking, low-stock monitoring, and food-demand reporting.
- Admin user management, system settings, attendance statistics, and analytics access.
- Daily local waste-reduction suggestions based on attendance, meal ingredients, and historical waste; no paid AI service is required.
- Daily, weekly, and monthly analytics for attendance, demand, waste, and inventory usage.
- JWT authentication and server-enforced role authorization.

## Architecture

```
React + Vite frontend  →  Express REST API  →  MongoDB / MongoDB Atlas
                         └─ JWT authentication and role authorization
```

The frontend reads `VITE_API_BASE_URL`; the backend exposes API routes below `/api`. The health endpoint is `GET /api/health` and reports database connectivity.

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- MongoDB Atlas, or a local MongoDB replica set

> Inventory usage and meal-recovery operations use MongoDB transactions. MongoDB Atlas supports them by default. For local development, run MongoDB as a single-node replica set rather than a standalone server.

## Installation

Clone or open the project, then install dependencies in both applications:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Database setup

### MongoDB Atlas (recommended)

1. Create a MongoDB Atlas cluster and database user.
2. Add your development or deployment IP address to the network access list.
3. Copy the connection URI and place it in `backend/.env` as `MONGODB_URI`.

### Local MongoDB replica set

Start MongoDB with replication enabled, then initialize it once in `mongosh`:

```bash
mongod --dbpath ./mongo-data --replSet rs0
mongosh --eval "rs.initiate()"
```

Use this URI in the backend environment file:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/smart_campus_mess?replicaSet=rs0
```

## Environment configuration

Create `backend/.env` from `backend/.env.example`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/smart_campus_mess?replicaSet=rs0
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_characters
DAILY_LOCK_TIME=20:00
```

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Never commit `.env` files or production secrets. Use a randomly generated, long JWT secret in every deployed environment.

## Running locally

Run the backend:

```bash
cd backend
npm run dev
```

Run the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`. Confirm backend/database status at `http://localhost:5000/api/health`.

## Production build

```bash
cd frontend
npm run build

cd ../backend
npm start
```

Deploy the generated `frontend/dist` directory to a static host and set `VITE_API_BASE_URL` to the public API URL before building. Deploy the backend behind HTTPS and set `CLIENT_URL` to the exact public frontend origin.

## API and access control

All protected routes require `Authorization: Bearer <token>`. The server checks the user record on every protected request, so revoked/deleted accounts lose access immediately.

| Area | Student | Mess Chief | Admin |
| --- | :---: | :---: | :---: |
| Bookings, recovery, feedback | Yes | No | No |
| Menus and inventory CRUD | No | Yes | Yes |
| Analytics and daily AI suggestions | No | Yes | Yes |
| User management and settings | No | No | Yes |

Important endpoints include:

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/meals`
- `GET/POST/PUT/DELETE /api/inventory` and `POST /api/inventory/:itemId/usage`
- `POST /api/orders`, `PATCH /api/orders/:orderId/cancel`
- `GET /api/reports/analytics?period=daily|weekly|monthly`
- `POST /api/ai/daily-lock`

## Quality and security checks

- API request bodies are limited to 100 KB; unknown routes return JSON 404 errors.
- Common invalid IDs, duplicate records, and Mongoose validation failures return safe 4xx responses.
- Security headers, restricted CORS methods/headers, JWT algorithm restriction, password hashing, and role authorization are enabled.
- Frontend routes mirror server roles; server authorization remains the source of truth.
- The responsive layout uses MUI breakpoints and has been production-built with Vite.

Before deployment, test login for each role and exercise the required CRUD flows against the target MongoDB deployment. Verify `/api/health` returns `{ "status": "ok", "database": "connected" }`.
