# Quick Reference Card

## Run Everything in One Command

```bash
cd d:\Projects\Qline
docker-compose up -d
```

Then go to: **http://localhost:3000**

---

## URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Patient/Doctor/Admin UI |
| Backend API | http://localhost:5000 | REST API |
| Health Check | http://localhost:5000/health | Service status |
| Admin Dashboard | http://localhost:5000/admin/queues | Job queues |

---

## Test User Accounts

After running migrations/setup:

```json
{
  "admin": {
    "email": "admin@qline.app",
    "password": "admin123"
  },
  "doctor": {
    "email": "doctor@qline.app",
    "password": "doctor123"
  },
  "patient": {
    "email": "patient@qline.app",
    "password": "patient123"
  }
}
```

---

## Key Commands

### Start Services

```bash
# All in one (Docker)
docker-compose up

# With live logs
docker-compose up -V

# Detached (background)
docker-compose up -d

# Rebuild images
docker-compose up --build
```

### Stop Services

```bash
docker-compose stop      # Pause services
docker-compose down      # Stop and remove containers
docker-compose down -v   # Stop and remove everything (including data)
```

### View Logs

```bash
docker-compose logs -f api     # Backend logs (live)
docker-compose logs -f mongo   # Database logs
docker-compose logs -f redis   # Cache logs
docker-compose logs mongo      # Last 100 lines
```

### Reset Everything

```bash
docker-compose down -v && docker-compose up
# Drops all data and starts fresh
```

### Run Individual Services Locally

```bash
# Backend (after npm install)
cd backend
npm run dev    # Development with hot-reload
npm start      # Production

# Frontend (after npm install)
cd frontend
npm run dev    # Development
npm run build && npm start  # Production
```

---

## Files Changed

| File | Change | Reason |
|------|--------|--------|
| `backend/services/analyticsService.js` | Added `scheduleDailyAnalytics()` | Server startup was failing |
| `backend/controllers/analyticsController.js` | Fixed doctor ID reference | JWT contains `userId`, not `doctorId` |
| `frontend/contexts/SocketContext.jsx` | Added date to room name | Real-time updates weren't matching rooms |
| `backend/.env` | Added encryption key | Medical records need encryption |

---

## Verify Everything Works

```bash
# Check all services running
docker-compose ps

# Check backend health
curl http://localhost:5000/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"patient@example.com","password":"pass123"}'

# Check Socket.IO connection (in browser console)
const socket = io('http://localhost:5000');
socket.on('connect', () => console.log('Connected!'));
```

---

## Common Issues

| Error | Fix |
|-------|-----|
| Port 5000 in use | `taskkill /PID <pid> /F` or change PORT in .env |
| MongoDB not connecting | Run `docker-compose up mongo` |
| Redis not connecting | Run `docker-compose up redis` |
| Frontend won't load | Check Console tab in browser DevTools |
| Socket connection fails | Verify FRONTEND_URL in backend .env matches |
| Module not found | Run `npm install` in backend/frontend |

---

## Features to Test

- [ ] User registration (Patient, Doctor, Admin)
- [ ] User login and token generation
- [ ] Doctor schedule configuration
- [ ] Appointment booking
- [ ] Real-time queue tracking
- [ ] Doctor marks patient complete
- [ ] Notification delivery
- [ ] Medical record creation
- [ ] Admin dashboard
- [ ] Analytics data

---

## Environment

```bash
# Windows
curl http://localhost:5000/health

# Mac/Linux
curl http://localhost:5000/health

# PowerShell
Invoke-RestMethod http://localhost:5000/health | ConvertTo-Json
```

---

## Documentation

- **[STARTUP_GUIDE.md](STARTUP_GUIDE.md)** - Full setup guide with 3 options
- **[IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)** - What was fixed
- **[COMPREHENSIVE_PROJECT_ANALYSIS.md](COMPREHENSIVE_PROJECT_ANALYSIS.md)** - Technical details

---

**That's it!** Your app is ready to run. 🚀
