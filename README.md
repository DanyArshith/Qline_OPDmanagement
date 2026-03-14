# Qline

Qline is an OPD queue and appointment management system with:

- `frontend`: Next.js 14 app
- `backend`: Express + Socket.IO API
- `worker`: background job processor backed by MongoDB

This repository is now set up for deployment without Docker.

## Stack

- Node.js 20+
- Next.js 14
- Express
- MongoDB
- Socket.IO
- PM2 for process management
- Nginx for reverse proxy and HTTPS

## Local development

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment files

Backend:

```bash
cp backend/.env.example backend/.env
```

Frontend:

```bash
cp frontend/.env.example frontend/.env.local
```

Minimum values to update:

- `backend/.env`
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET`
  - `MEDICAL_RECORD_ENCRYPTION_KEY`
  - `FRONTEND_URL=http://localhost:3000`
- `frontend/.env.local`
  - `NEXT_PUBLIC_API_URL=http://localhost:5000`

### 3. Start the app

Backend API:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Optional worker in a separate terminal:

```bash
cd backend
npm run worker
```

## Production deployment

Recommended production layout:

- `qline-api` on port `5000`
- `qline-worker` as a separate PM2 process
- `qline-frontend` on port `3000`
- `Nginx` in front of both
- `MongoDB Atlas` or another managed MongoDB instance

Quick hosted option:

- Render Blueprint via [`render.yaml`](/d:/Projects/Qline/render.yaml)
- Render guide: [`docs/RENDER_DEPLOYMENT.md`](/d:/Projects/Qline/docs/RENDER_DEPLOYMENT.md)

Use these files:

- PM2 config: [`ecosystem.config.js`](/d:/Projects/Qline/ecosystem.config.js)
- Nginx template: [`deploy/nginx/qline.conf`](/d:/Projects/Qline/deploy/nginx/qline.conf)
- Full guide: [`docs/DEPLOYMENT.md`](/d:/Projects/Qline/docs/DEPLOYMENT.md)

High-level deploy flow:

```bash
cd /var/www/qline/backend && npm ci
cd /var/www/qline/frontend && npm ci && npm run build
cd /var/www/qline && pm2 start ecosystem.config.js
```

## Important notes

- Docker files still exist in the repo as legacy artifacts, but they are not required for local or production deployment.
- Redis is no longer part of the runtime. Jobs and caching are MongoDB-backed in the current codebase.
- Run a single backend instance unless you first add multi-instance coordination for Socket.IO and in-memory cache behavior.

## Health check

Backend health endpoint:

```text
GET /health
```

## Scripts

Backend:

- `npm run dev`
- `npm start`
- `npm run worker`
- `npm test`

Frontend:

- `npm run dev`
- `npm run build`
- `npm start`

## Repository notes

- Backend env loading now supports both `backend/.env` and the repo-root `.env`, so existing setups do not break.
- Frontend env files should live inside `frontend/` because Next.js reads env files from the app directory.
