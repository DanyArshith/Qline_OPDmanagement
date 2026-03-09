# Qline Backend

Backend server for Qline - OPD Queue and Appointment Management System.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (Access + Refresh Token)
- **Real-time**: Socket.IO
- **Security**: bcrypt, helmet, CORS

## Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   └── authController.js     # Authentication logic
├── middleware/
│   ├── auth.js              # JWT verification
│   ├── roleCheck.js         # Role-based access control
│   └── errorHandler.js      # Centralized error handling
├── models/
│   ├── User.js              # User schema
│   ├── RefreshToken.js      # Refresh token schema
│   ├── Doctor.js            # Doctor schema (Phase 2)
│   ├── Appointment.js       # Appointment schema (Phase 2)
│   └── DailyQueue.js        # Queue schema (Phase 2)
├── routes/
│   └── auth.js              # Authentication routes
├── services/
│   └── slotService.js       # Slot generation (Phase 2)
├── sockets/
│   └── queueSocket.js       # Socket.IO handlers
├── utils/
│   └── asyncHandler.js      # Async error wrapper
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
├── server.js                # Entry point
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
MONGODB_URI=mongodb://localhost:27017/qline
# OR use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/qline

JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRY=15m

JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_REFRESH_EXPIRY=7d
REFRESH_COOKIE_NAME=qline_rt

PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**OR use MongoDB Atlas** (create free cluster at mongodb.com/cloud/atlas)

### 4. Run the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "patient"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

`refreshToken` is issued as an `httpOnly` cookie and not returned in response JSON.

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Refresh Access Token
```http
POST /api/auth/refresh
Content-Type: application/json
```

No request body token is required when the refresh cookie is present.

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout
```http
POST /api/auth/logout
Content-Type: application/json
```

Logout clears the `httpOnly` refresh cookie and invalidates the matching refresh token in storage.

### Health Check
```http
GET /health
```

## Testing with PowerShell

### Register a Patient
```powershell
$body = @{
    name = "Test Patient"
    email = "patient@test.com"
    password = "Test123!"
    role = "patient"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -ContentType "application/json" -Body $body
```

### Login
```powershell
$body = @{
    email = "patient@test.com"
    password = "Test123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $body
$response
```

### Use Access Token
```powershell
# Save the access token from login response
$token = $response.accessToken

# Use it in protected routes (example for future endpoints)
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/protected-route" -Headers $headers
```

## Security Features

- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Refresh tokens hashed before storage
- ✅ JWT access tokens (short-lived, 15 minutes)
- ✅ JWT refresh tokens (long-lived, 7 days)
- ✅ Automatic token cleanup via TTL index
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation with express-validator
- ✅ Centralized error handling
- ✅ Role-based access control

## Development Status

### ✅ Phase 1 Complete (Backend Scaffolding)
- Express server with CORS and security
- MongoDB connection
- User authentication (register, login, refresh, logout)
- JWT access + refresh token system
- Role-based access control middleware
- Centralized error handling
- Socket.IO setup
- Clean folder structure

### 🔄 Phase 2 Next (Slot Generation)
- Doctor schedule configuration
- Slot generation service
- Appointment booking with race condition prevention
- Database models ready (placeholder)

## License

ISC
