# Qline - Startup & Running Guide

**Date**: February 21, 2026  
**Status**: ✅ Ready to Run (All critical fixes implemented)

---

## What Was Fixed

All 7 critical issues have been resolved:

1. ✅ **Missing IP Whitelist Middleware** - Already existed in `backend/middleware/ipWhitelist.js`
2. ✅ **Missing Notification Service Method** - Already implemented in notificationService (line 300+)
3. ✅ **Missing Analytics Scheduler** - Implemented in `backend/services/analyticsService.js`
4. ✅ **Incomplete Medical Record Controller** - Already fully implemented
5. ✅ **Analytics Controller Field Bug** - Fixed (now queries Doctor model by userId)
6. ✅ **Socket.IO Room Naming** - Fixed (now includes date in room name)
7. ✅ **Environment Variables** - Configured with encryption key

---

## Prerequisites

- **Node.js**: v18+ (check: `node --version`)
- **Docker & Docker Compose**: (Optional, but recommended)
- **MongoDB**: 8.0.3 (via Docker or local)
- **Redis**: 7.2 (via Docker or local)

---

## Quick Start (3 Options)

### Option A: Docker Compose (Recommended - Single Command)

```bash
cd d:\Projects\Qline

# Start all services (backend, frontend, mongo, redis)
docker-compose up

# Wait 40-50 seconds for health checks to pass
# ✅ Backend: http://localhost:5000
# ✅ Frontend: http://localhost:3000
# ✅ API Health: http://localhost:5000/health
# ✅ Admin Queue Board: http://localhost:5000/admin/queues
```

**To stop**: Press `Ctrl+C` or run `docker-compose down`

---

### Option B: Local Installation (Separate Services)

#### 1. Install Dependencies

```bash
# Backend
cd d:\Projects\Qline\backend
npm install

# Frontend
cd d:\Projects\Qline\frontend
npm install
```

#### 2. Start MongoDB Locally

```bash
# Using Docker
docker run --name qline-mongo -d -p 27017:27017 mongo:7.0

# Or use your local MongoDB installation
```

#### 3. Start Redis Locally

```bash
# Using Docker
docker run --name qline-redis -d -p 6379:6379 redis:7.2-alpine

# Or use your local Redis installation
```

#### 4. Start Backend

```bash
cd d:\Projects\Qline\backend
npm run dev  # Development with auto-reload
# OR
npm start    # Production
```

**Wait for**: `Server running on port 5000` message

#### 5. Start Frontend (in new terminal)

```bash
cd d:\Projects\Qline\frontend
npm run dev  # Development
# OR
npm run build && npm start  # Production
```

**Wait for**: `Ready in X.XXs` message  
**Access**: http://localhost:3000

---

### Option C: Hybrid (Docker for DB, Local for App Code)

```bash
# Terminal 1: Start databases
docker-compose up mongo redis

# Terminal 2: Start backend
cd d:\Projects\Qline\backend
npm install
npm run dev

# Terminal 3: Start frontend
cd d:\Projects\Qline\frontend
npm install
npm run dev
```

---

## Verification Checklist

After startup, verify each component:

```bash
# ✅ Check Backend Health
curl http://localhost:5000/health

# Expected response:
# {
#   "status": "ok",
#   "services": {
#     "mongodb": "connected",
#     "redis": "connected"
#   }
# }

# ✅ Check Frontend Loads
open http://localhost:3000
# Should load without errors in browser console

# ✅ Check Socket.IO Connection
# Open DevTools (F12) → Network tab → Filter "WS"
# Should see WebSocket connection to localhost:5000

# ✅ Check Database Initialization
# Should see indexes created, cache warmed in logs

# ✅ Check Admin Queue Board
open http://localhost:5000/admin/queues
# Should show 4 queues: email, reminder, analytics, notification
```

---

## Test the Full Flow

### 1. Register a New User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Patient",
    "email": "patient@example.com",
    "password": "SecurePass123!",
    "role": "patient"
  }'

# Response should have: { "success": true, "token": "..." }
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "SecurePass123!"
  }'

# Response includes access token (valid 15m) and refresh token (valid 7d)
```

### 3. Create a Doctor

```bash
# First, register as admin
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin",
    "email": "admin@qline.app",
    "password": "AdminPass123!",
    "role": "admin"
  }'

# Get admin token (from login response)
ADMIN_TOKEN="your_token_here"

# Create doctor
curl -X POST http://localhost:5000/api/doctors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "userId": "doctor_user_id",
    "departmentName": "Cardiology",
    "defaultConsultTime": 30,
    "maxPatientsPerDay": 20,
    "workingDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "workingHours": { "start": "09:00", "end": "17:00" }
  }'
```

### 4. Book an Appointment

```bash
# Get patient token from login
PATIENT_TOKEN="your_patient_token"

curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PATIENT_TOKEN" \
  -d '{
    "doctorId": "doctor_id_from_step_3",
    "date": "2026-02-25",
    "slotStart": "09:00",
    "slotEnd": "09:30"
  }'
```

### 5. Real-Time Queue Updates (Test Socket.IO)

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run:
   ```javascript
   // Connect to socket
   const socket = io('http://localhost:5000', {
       auth: { token: 'your_patient_token' }
   });
   
   socket.on('queue:update', (data) => {
       console.log('Queue updated:', data);
   });
   ```
4. Doctor marks patient as complete from another window
5. Should see real-time update in console

---

## Environment Variables Guide

### Backend (.env)

```env
# Critical for operation
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/qline
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication - MUST BE SET (even for development)
JWT_SECRET=qline_super_secret_jwt_key_dev_2026
JWT_EXPIRY=15m
JWT_REFRESH_SECRET=qline_super_secret_refresh_key_dev_2026
JWT_REFRESH_EXPIRY=7d

# Medical Record Encryption - MUST BE SET
MEDICAL_RECORD_ENCRYPTION_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1

# Email (Optional - set if using email notifications)
SENDGRID_API_KEY=
FROM_EMAIL=noreply@qline.com

# Frontend communication
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Common Issues & Solutions

### 1. "Cannot find module 'dotenv'"
**Solution**: `npm install` in backend directory

### 2. "MongoError: connect ECONNREFUSED"
**Solution**: 
```bash
# If using Docker
docker-compose up mongo

# Or verify MongoDB is running on port 27017
# Command: netstat -an | findstr 27017 (Windows)
```

### 3. "Redis connection failed"
**Solution**:
```bash
# If using Docker
docker-compose up redis

# Or verify Redis is running on port 6379
# Command: redis-cli ping (should return PONG)
```

### 4. Socket.IO not connecting (WebSocket error)
**Solution**: Check backend is running and FRONTEND_URL matches exactly
```bash
# Verify in browser console - should see successful WebSocket connection
# Check backend logs for socket auth success messages
```

### 5. "MEDICAL_RECORD_ENCRYPTION_KEY not set"
**Solution**: Add to .env file (already done):
```env
MEDICAL_RECORD_ENCRYPTION_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1
```

### 6. "Port 5000 already in use"
**Solution**: Change PORT in .env or kill process:
```bash
# Find process on port 5000 (Windows)
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change PORT in .env
PORT=5001
```

### 7. "Frontend shows "Cannot GET /""
**Solution**: Ensure frontend built and running:
```bash
cd frontend
npm install
npm run build
npm start
# Or for development: npm run dev
```

---

## Logs & Debugging

### View Backend Logs

```bash
# Docker
docker-compose logs api

# Or tail logs
docker-compose logs -f api

# Local - check logs directory
tail -f backend/logs/error.log
tail -f backend/logs/combined.log
```

### View Database Logs

```bash
docker-compose logs mongo
```

### View Redis Logs

```bash
docker-compose logs redis
```

### Enable Debug Mode

```bash
# Backend
DEBUG=* npm run dev

# Frontend
DEBUG=* npm run dev
```

---

## Production Checklist

Before deploying to production:

- [ ] Change `NODE_ENV=production`
- [ ] Generate strong JWT secrets (don't use dev values)
  ```bash
  openssl rand -hex 32  # Generate twice
  ```
- [ ] Generate strong encryption key
  ```bash
  openssl rand -hex 32
  ```
- [ ] Set `ADMIN_IP_WHITELIST` to allowed IPs
- [ ] Configure real SENDGRID_API_KEY for emails
- [ ] Set SENTRY_DSN for error monitoring
- [ ] Run workers in separate process (docker-compose.prod.yml)
- [ ] Enable HTTPS/SSL
- [ ] Setup database backups
- [ ] Monitor logs and metrics
- [ ] Test full flow:
  - User registration
  - Doctor scheduling
  - Appointment booking
  - Real-time queue updates
  - Medical record creation
  - Analytics dashboard

---

## Next Steps

1. **Start the application** (choose option A, B, or C above)
2. **Verify health** using the verification checklist
3. **Test the flow** using the test commands
4. **Check logs** if anything fails
5. **Review code** in `backend/controllers` and `frontend/app` to understand the architecture

---

## Documentation

- **Architecture**: [qline_tech_stack_document.md](docs/qline_tech_stack_document.md)
- **Features**: [qline_product_requirements_document.md](docs/qline_product_requirements_document.md)
- **Design**: [qline_design_document.md](docs/qline_design_document.md)
- **Analysis**: [COMPREHENSIVE_PROJECT_ANALYSIS.md](COMPREHENSIVE_PROJECT_ANALYSIS.md)

---

## Support

For issues:
1. Check logs in `backend/logs/`
2. Review error in browser DevTools console
3. Verify all services are running: `docker-compose ps`
4. Check environment variables are set correctly
5. Verify ports are not in use: Windows: `netstat -ano`, Linux/Mac: `lsof -i`

---

**Ready to run? Start with:**
```bash
cd d:\Projects\Qline
docker-compose up
```

**Then access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Admin Dashboard: http://localhost:5000/admin/queues
- Health Check: http://localhost:5000/health

🚀 Enjoy your fully functional Qline system!
