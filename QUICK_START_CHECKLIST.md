# Qline Quick Start - Critical Issues Checklist

## 🚨 CRITICAL BLOCKERS (Fix Immediately)

### 1. Create Missing Middleware File
**File**: `backend/middleware/ipWhitelist.js` (DOES NOT EXIST)

```javascript
const logger = require('../utils/logger');

const ipWhitelist = (allowedIps) => {
    return (req, res, next) => {
        const clientIp = req.ip || req.connection.remoteAddress;
        
        if (!allowedIps.includes(clientIp)) {
            logger.warn(`Access denied for IP: ${clientIp}`);
            return res.status(403).json({
                success: false,
                error: 'Access denied: IP not whitelisted'
            });
        }
        next();
    };
};

module.exports = ipWhitelist;
```

### 2. Implement Missing Method - Notification Service
**File**: `backend/services/notificationService.js` (Add export around line 150)

Add this method (currently called by reminderWorker but missing):
```javascript
/**
 * Send appointment reminder notification
 * Called 24 hours before appointment
 */
exports.sendAppointmentReminderNotification = async (appointment) => {
    const patient = appointment.patientId;
    const doctor = appointment.doctorId;
    
    // Send email reminder
    const appointmentTime = new Date(appointment.slotStart).toLocaleDateString();
    const subject = `Reminder: Your appointment with Dr. ${doctor.name}`;
    const html = `
        <p>Dear ${patient.name},</p>
        <p>This is a reminder that you have an upcoming appointment with Dr. ${doctor.name} on ${appointmentTime}.</p>
        <p>Please arrive 10 minutes early.</p>
    `;
    
    await this.sendEmail(patient.email, subject, html);
    
    // Send in-app notification
    const type = 'appointment_reminder';
    const title = 'Appointment Reminder';
    const message = `Upcoming appointment with Dr. ${doctor.name} on ${appointmentTime}`;
    
    await this.createNotification(patient._id, type, title, message, {
        appointmentId: appointment._id,
        doctorName: doctor.name
    });
};
```

### 3. Implement Missing Method - Analytics Service
**File**: `backend/services/analyticsService.js` (Add export at end)

Add this method:
```javascript
/**
 * Schedule daily analytics calculation
 * Runs at midnight for all active doctors
 */
exports.scheduleDailyAnalytics = async () => {
    const logger = require('../utils/logger');
    const cron = require('node-cron');
    const Doctor = require('../models/Doctor');
    const analyticsQueue = require('../queues/analyticsQueue');
    
    // Schedule job at midnight UTC
    cron.schedule('0 0 * * *', async () => {
        try {
            const doctors = await Doctor.find().select('_id').lean();
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            for (const doctor of doctors) {
                await analyticsQueue.add('calculate-analytics', {
                    doctorId: doctor._id,
                    date: yesterday
                });
            }
            
            logger.info(`Scheduled analytics calculation for ${doctors.length} doctors`);
        } catch (error) {
            logger.error('Error scheduling analytics:', error);
        }
    });
};
```

### 4. Complete Incomplete Method
**File**: `backend/controllers/medicalRecordController.js` (Line ~105)

The `getPatientHistory()` method is incomplete. Complete it like this:
```javascript
exports.getPatientHistory = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { patientId } = req.params;

    // Patients can only view their own records
    if (req.user.role === 'patient' && userId !== patientId) {
        return res.status(403).json({
            success: false,
            error: 'You can only view your own medical records'
        });
    }

    const records = await MedicalRecord.find({ patientId })
        .populate('doctorId')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
        .sort({ date: -1 })
        .lean();

    res.status(200).json({
        success: true,
        records,
        total: records.length
    });
});
```

---

## 🔧 CODE BUG FIXES

### Fix #1: Incorrect Field Access in Analytics
**File**: `backend/controllers/analyticsController.js` (Line 8, 20, 43)

Replace:
```javascript
const doctorId = req.user.doctorId;  // ❌ WRONG
```

With:
```javascript
const Doctor = require('../models/Doctor');
const doctor = await Doctor.findOne({ userId: req.user.userId });
if (!doctor) {
    return res.status(403).json({
        success: false,
        error: 'Doctor profile not found'
    });
}
const doctorId = doctor._id;
```

### Fix #2: Socket Room Naming Mismatch
**File**: `frontend/contexts/SocketContext.jsx` (Line 55)

Replace:
```javascript
const room = `doctor:${doctorId}`
```

With:
```javascript
const room = `doctor:${doctorId}:${date}`
```

### Fix #3: ObjectId Constructor
**File**: `backend/services/estimationService.js` (Line ~145)

Replace:
```javascript
doctorId: require('mongoose').Types.ObjectId.createFromHexString(...)
```

With:
```javascript
const { ObjectId } = require('mongoose').Types;
doctorId: new ObjectId(doctorId.toString())
```

---

## 📝 ENVIRONMENT SETUP

### 1. Create Backend .env File
**File**: `backend/.env`

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/qline

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_MAX_MEMORY=256mb
REDIS_EVICTION_POLICY=allkeys-lru

# Authentication (GENERATE RANDOM STRINGS!)
JWT_SECRET=your-random-secret-32-chars-minimum-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-different-secret-32-chars-minimum-change
JWT_REFRESH_EXPIRY=7d

# Email (choose one)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@qline.app

# Security - Medical Records
MEDICAL_RECORD_ENCRYPTION_KEY=your-encryption-key-32-chars-minimum

# Optional
SENTRY_DSN=
ADMIN_IP_WHITELIST=
```

### 2. Create Frontend .env.local File
**File**: `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Generate Secure Secrets (Linux/Mac)
```bash
openssl rand -hex 32  # Run twice - once for JWT_SECRET, once for JWT_REFRESH_SECRET
openssl rand -hex 16  # For MEDICAL_RECORD_ENCRYPTION_KEY
```

---

## ✅ INSTALLATION STEPS

### Option A: Docker Compose (Recommended for Dev)
```bash
# Root directory
docker-compose up

# Wait ~40 seconds for health checks
# Backend: http://localhost:5000
# Frontend: http://localhost:3000
# MongoDB: localhost:27017
# Redis: localhost:6379

# Initialize indexes (in another terminal)
docker exec qline_api npm run db:optimize
```

### Option B: Local Installation
```bash
# Backend
cd backend
npm install
npm run db:optimize  # Create database indexes
npm run dev          # Start in watch mode

# Frontend (new terminal)
cd frontend
npm install
npm run dev

# Services should already be running (MongoDB, Redis)
```

---

## 🧪 VERIFICATION TESTS

### 1. Backend Health Check
```bash
curl http://localhost:5000/health
```
**Expected Output**:
```json
{
  "status": "ok",
  "services": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

### 2. Register Test User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "patient"
  }'
```
**Expected**: Access token and refresh token returned

### 3. Login Test
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```
**Expected**: Receive JWT tokens

### 4. Frontend Navigation
- Open http://localhost:3000/login
- Create account or login
- Should redirect to role dashboard
- Check browser console for errors

---

## 🚀 BEFORE PRODUCTION

### Security
- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET` (use `openssl rand -hex 32`)
- [ ] Set `MEDICAL_RECORD_ENCRYPTION_KEY` (never leave empty)
- [ ] Configure IP whitelist if needed: `ADMIN_IP_WHITELIST=127.0.0.1`
- [ ] Set `REQUIRE_REDIS_IN_PRODUCTION=true`
- [ ] Enable Sentry monitoring: `SENTRY_DSN=https://...`

### Performance
- [ ] Run separate worker process: `node workers/index.js`
- [ ] Use production-grade Redis instance (not localhost)
- [ ] Use production MongoDB (Atlas or self-hosted with replicas)
- [ ] Configure proper log retention

### Deployment
- [ ] Review `docker-compose.prod.yml`
- [ ] Setup database backups
- [ ] Configure HTTPS/TLS
- [ ] Setup monitoring and alerting
- [ ] Run full test suite: `npm test`

---

## 📊 COMMON ISSUES & FIXES

### "Cannot find module 'ipWhitelist'"
**Fix**: Create `backend/middleware/ipWhitelist.js` (see CRITICAL BLOCKERS #1)

### "sendAppointmentReminderNotification is not a function"
**Fix**: Add method to `backend/services/notificationService.js` (see CRITICAL BLOCKERS #2)

### "scheduleDailyAnalytics is not a function"
**Fix**: Add method to `backend/services/analyticsService.js` (see CRITICAL BLOCKERS #3)

### Socket.IO events not received
**Fix**: Check room name format - should include date (see CODE BUG FIXES #2)

### "Doctor profile not found" on analytics
**Fix**: Change field access from `req.user.doctorId` to query Doctor model (see CODE BUG FIXES #1)

### MongoDB connection refused
**Fix**: 
```bash
# Check if MongoDB running
mongosh  # Should connect

# Or with Docker
docker-compose ps  # Check mongo health
docker logs qline_mongo
```

### Redis connection refused  
**Fix**:
```bash
# Check if Redis running
redis-cli ping  # Should return PONG

# Or with Docker
docker-compose ps  # Check redis health
docker logs qline_redis
```

---

## 📞 GETTING HELP

### Debug Mode
```bash
# Backend
DEBUG=qline* npm run dev

# See detailed logs
cat backend/logs/combined-*.log
```

### API Documentation
- Auth endpoints: [backend/routes/auth.js](backend/routes/auth.js)
- Appointment endpoints: [backend/routes/appointment.js](backend/routes/appointment.js)
- Queue endpoints: [backend/routes/queue.js](backend/routes/queue.js)

### Test Data
Database automatically initializes via `scripts/mongo-init.js` in Docker

---

## ⏱️ ESTIMATED TIMELINE

- **Fix Critical Issues**: 2-4 hours
- **Setup & Test**: 1-2 hours
- **Full Testing**: 1-2 days
- **Production Deployment**: 1 day

**Total**: ~4-6 days for production-ready system

---

**Last Updated**: February 21, 2026  
**Status**: Ready to fix and deploy
