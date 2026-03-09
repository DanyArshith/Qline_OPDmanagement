# Qline - OPD Queue Management System

A comprehensive **Queue Management System for Out-Patient Departments (OPD)** built with modern web technologies. Qline streamlines patient queue management, appointment scheduling, doctor workflows, and medical record management.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Database Setup](#database-setup)
- [Docker Setup](#docker-setup)
- [API Documentation](#api-documentation)
- [Project Phases](#project-phases)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### Core Functionality
- **Queue Management**: Real-time patient queue tracking and management
- **Appointments**: Schedule and manage patient appointments
- **Patient Management**: Complete patient profiles and history
- **Doctor Dashboard**: Doctor-specific queue and appointment views
- **Medical Records**: Structured medical record keeping
- **Admin Panel**: System administration and analytics
- **Role-Based Access Control**: Different roles (Admin, Doctor, Patient)

### Advanced Features
- **Email Notifications**: Appointment reminders and updates via SendGrid/SMTP
- **Real-time Updates**: WebSocket support for live queue updates
- **Analytics Dashboard**: Queue analytics and performance metrics
- **Audit Logging**: Complete system audit trail
- **Error Monitoring**: Sentry integration for error tracking
- **Rate Limiting**: API protection against abuse
- **Encryption**: Medical record encryption at rest
- **Redis Caching**: Performance optimization with Redis

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: SendGrid / SMTP
- **Error Monitoring**: Sentry
- **Real-time**: Socket.io

### Frontend
- **Framework**: Next.js 14+
- **Language**: JavaScript/TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API / Zustand
- **UI Components**: Custom components + shadcn/ui
- **HTTP Client**: Axios

### DevOps
- **Containerization**: Docker & Docker Compose
- **Version Control**: Git & GitHub

---

## 📁 Project Structure

```
Qline/
├── backend/                 # Node.js/Express backend
│   ├── config/             # Configuration files (DB, Redis, Sentry)
│   ├── controllers/        # Route controllers
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API route definitions
│   ├── middleware/        # Custom middleware
│   ├── services/          # Business logic
│   ├── queues/            # Job queues (email, notifications)
│   ├── workers/           # Background workers
│   ├── sockets/           # WebSocket handlers
│   ├── utils/             # Utility functions
│   ├── scripts/           # Setup and helper scripts
│   ├── server.js          # Application entry point
│   ├── package.json       # Backend dependencies
│   └── Dockerfile         # Docker configuration
│
├── frontend/              # Next.js frontend
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   ├── contexts/         # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── public/           # Static assets
│   ├── styles/           # Global styles
│   ├── package.json      # Frontend dependencies
│   ├── next.config.js    # Next.js configuration
│   ├── tailwind.config.js # Tailwind configuration
│   └── Dockerfile        # Docker configuration
│
├── docker-compose.yml    # Docker Compose orchestration
├── .env                  # Environment variables (create from .env.example)
├── README.md            # This file
└── docs/                # Documentation

```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
  - [Download Node.js](https://nodejs.org/)
  
- **MongoDB**: v5.0 or higher
  - [Download MongoDB Community](https://www.mongodb.com/try/download/community)
  - OR use MongoDB Atlas (cloud option)
  
- **Redis**: v6.0 or higher
  - [Download Redis](https://redis.io/download)
  - OR use Docker (recommended)

- **Docker & Docker Compose** (Optional but recommended)
  - [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)

- **Git**: For version control
  - [Download Git](https://git-scm.com/)

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/DanyArshith/Qline_OPDmanagement.git
cd Qline
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### Step 3: Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### Step 4: Configure Environment Variables

Copy the `.env` file in the root directory (it should already exist in the repo with defaults):

```bash
# The .env file is already included in the repository for development
# For production, update the values in .env file with your actual credentials
```

#### Key environment variables to update:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/qline

# JWT
JWT_SECRET=your_secure_jwt_secret_here
JWT_REFRESH_SECRET=your_secure_refresh_secret_here

# Frontend
FRONTEND_URL=http://localhost:3000

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (SendGrid or SMTP)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com

# Sentry (Optional)
SENTRY_DSN=your_sentry_dsn

# Server Port
PORT=5000
NODE_ENV=development
```

---

## ⚙️ Configuration

### Database Configuration

**Option 1: Local MongoDB**

1. Install and start MongoDB locally
2. Create database:
   ```bash
   mongosh
   > use qline
   > exit
   ```

**Option 2: MongoDB Atlas (Cloud)**

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster and get connection string
3. Update `MONGODB_URI` in `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qline
   ```

### Redis Configuration

**Option 1: Local Redis**

```bash
# Windows/Mac with Docker (recommended)
docker run -d -p 6379:6379 redis:7-alpine

# Or install locally and start
# Linux: sudo systemctl start redis-server
# Mac: brew services start redis
# Windows: Use WSL or Docker
```

**Option 2: Redis Cloud**

1. Create account at [Redis Cloud](https://redis.com/try-free/)
2. Update `.env`:
   ```env
   REDIS_HOST=your-redis-host.redis.cloud
   REDIS_PORT=your-port
   REDIS_PASSWORD=your-password
   ```

---

## ▶️ Running the Application

### Option 1: Using Docker Compose (Recommended)

**Advantages**: All services in isolated containers, no local installation needed

```bash
# Start all services (Backend, Frontend, MongoDB, Redis)
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start (if you made changes)
docker-compose up -d --build
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### Option 2: Manual Setup (Local)

**Terminal 1: Start MongoDB**
```bash
# If installed locally
mongod

# Or using Docker
docker run -d -p 27017:27017 --name qline-mongo mongo:6
```

**Terminal 2: Start Redis**
```bash
# If installed locally
redis-server

# Or using Docker
docker run -d -p 6379:6379 --name qline-redis redis:7-alpine
```

**Terminal 3: Start Backend**
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

**Terminal 4: Start Frontend**
```bash
cd frontend
npm run dev
# Application runs on http://localhost:3000
```

---

## 🗄️ Database Setup

### Initialize Database Collections and Indexes

After starting MongoDB, run the initialization script:

```bash
# From the backend directory
node scripts/createIndexes.js

# Or from root
cd backend && node scripts/createIndexes.js
```

### Load Test Data (Optional)

```bash
cd backend
node setup-test-data.js
```

This creates sample:
- Admin user
- Doctor users
- Patient users
- Sample appointments
- Queue data

**Test Credentials:**
- Admin: `admin@qline.com` / `Admin@123`
- Doctor: `doctor@qline.com` / `Doctor@123`
- Patient: `patient@qline.com` / `Patient@123`

---

## 🐳 Docker Setup

### Docker Compose Services

The `docker-compose.yml` includes:

- **MongoDB**: Primary database (port 27017)
- **Redis**: Caching and job queue (port 6379)
- **Backend**: Express API server (port 5000)
- **Frontend**: Next.js application (port 3000)

### Build and Run

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Remove volumes (clears database)
docker-compose down -v
```

### Environment in Docker

Docker services read from the `.env` file for configuration. Ensure `.env` is in the root directory.

---

## 📡 API Documentation

### Authentication Endpoints

**POST /api/auth/register**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "User Name",
  "role": "patient" // or "doctor"
}
```

**POST /api/auth/login**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

### Key API Routes

- `POST /api/auth/*` - Authentication
- `GET/POST /api/appointments` - Appointment management
- `GET/POST /api/queue/*` - Queue operations
- `GET /api/doctor/*` - Doctor endpoints
- `GET/POST /api/patients` - Patient management
- `GET/POST /api/medical-records` - Medical records
- `GET /api/analytics/*` - Analytics data
- `POST /api/support` - Support tickets

Full API documentation is available in the backend README or via Swagger (if configured).

---

## 📊 Project Phases

The system was built in iterative phases:

### Phase 1: Core Setup
- Project structure and configuration
- Database models and schemas
- Basic API endpoints

### Phase 2: Features
- Authentication and authorization
- Patient queue management
- Appointment scheduling
- Doctor interfaces

### Phase 3: Patient Portal
- Patient registration and profiles
- Medical records
- Appointment booking
- Queue status tracking

### Phase 4: Advanced Features
- Email notifications (SendGrid/SMTP)
- Redis caching
- Job queues
- Error monitoring (Sentry)
- Rate limiting
- Encryption

### Phase 4.1: Production Ready
- Redis clustering
- Medical record encryption
- Enhanced email retry logic
- Performance optimization

---

## 🔧 Troubleshooting

### Backend Issues

**Port 5000 already in use**
```bash
# Find and kill process using port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>

# Or change PORT in .env to 5001
```

**MongoDB connection refused**
```bash
# Ensure MongoDB is running
mongd # Should output "waiting for connections on port 27017"

# Or check Docker container
docker ps | grep mongo
```

**Redis connection error**
```bash
# Ensure Redis is running
redis-cli ping  # Should output PONG

# Or check Docker
docker ps | grep redis
```

### Frontend Issues

**Port 3000 already in use**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or set custom port
npm run dev -- -p 3001
```

**Module not found errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Build errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Docker Issues

**Container won't start**
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

**Permission denied (Linux)**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Then log out and back in
```

---

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/qline` |
| `JWT_SECRET` | JWT signing key | `qline_super_secret_jwt` |
| `JWT_REFRESH_SECRET` | Refresh token signing key | `qline_refresh_secret` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` |
| `REDIS_HOST` | Redis server host | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `SENDGRID_API_KEY` | SendGrid API key for emails | Your API key |
| `SMTP_HOST` | SMTP server for fallback emails | `smtp.gmail.com` |
| `SENTRY_DSN` | Sentry error tracking DSN | Your DSN |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment | `development` or `production` |

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📞 Support & Contact

For issues, questions, or suggestions:

- **Issues**: Use GitHub Issues
- **Email**: support@qline.com
- **Documentation**: See `/docs` folder for detailed guides

---

## 🎯 Quick Start Checklist

- [ ] Clone the repository
- [ ] Install Node.js dependencies (backend & frontend)
- [ ] Set up MongoDB (local or cloud)
- [ ] Set up Redis (local or cloud)
- [ ] Configure `.env` file
- [ ] Start MongoDB
- [ ] Start Redis
- [ ] Run `npm start` in backend
- [ ] Run `npm run dev` in frontend
- [ ] Access http://localhost:3000
- [ ] Load test data: `node backend/setup-test-data.js`
- [ ] Login with test credentials

---

**Last Updated**: March 9, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅

