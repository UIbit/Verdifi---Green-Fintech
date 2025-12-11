# Authentication Guide - Verdifi Platform

## Overview

Verdifi now includes MongoDB-based authentication with user registration and login functionality.

## Features

- ✅ User registration with username, email, and password
- ✅ User login with email and password
- ✅ Password hashing with bcrypt
- ✅ Session management with MongoDB session store
- ✅ Protected dashboard route
- ✅ Protected Socket.IO connections
- ✅ Secure logout functionality

## Setup Instructions

### 1. Install MongoDB

#### Option A: Local MongoDB
```bash
# Windows (using Chocolatey)
choco install mongodb

# Or download from: https://www.mongodb.com/try/download/community
```

#### Option B: MongoDB Atlas (Cloud - Recommended)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/verdifi
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/verdifi

SESSION_SECRET=your-super-secret-session-key-change-this
PORT=3000
NODE_ENV=production
```

### 3. Start MongoDB (if using local)

```bash
# Windows
mongod

# Or start as a service
net start MongoDB
```

### 4. Run the Application

```bash
npm start
# or
npm run dashboard
```

## User Flow

### 1. **First Visit**
- User visits `http://localhost:3000`
- Automatically redirected to `/login`

### 2. **Sign Up**
- Click "Sign Up" tab
- Enter:
  - Username (min 3 characters)
  - Email (valid email format)
  - Password (min 6 characters)
- Click "Create Account"
- Automatically logged in and redirected to dashboard

### 3. **Login**
- Enter:
  - Email
  - Password
- Click "Login"
- Redirected to dashboard

### 4. **Dashboard Access**
- Dashboard is protected - requires login
- Shows user's carbon footprint monitoring
- All data is user-specific

### 5. **Logout**
- Click "Logout" button in header
- Session destroyed
- Redirected to login page

## API Endpoints

### POST `/api/auth/signup`
Register a new user.

**Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "...",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

### POST `/api/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "...",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

### POST `/api/auth/logout`
Logout current user.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET `/api/auth/status`
Check authentication status.

**Response (authenticated):**
```json
{
  "success": true,
  "authenticated": true,
  "user": {
    "id": "...",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

**Response (not authenticated):**
```json
{
  "success": true,
  "authenticated": false
}
```

## Database Schema

### User Collection

```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed, required),
  createdAt: Date,
  lastLogin: Date
}
```

## Security Features

1. **Password Hashing**: Uses bcrypt with salt rounds (10)
2. **Session Storage**: Stored in MongoDB (not in-memory)
3. **Secure Cookies**: HttpOnly, secure in production
4. **Input Validation**: Email format, password length, username constraints
5. **Protected Routes**: Dashboard requires authentication
6. **Protected WebSocket**: Socket.IO connections require authentication

## Deployment Notes

### Environment Variables for Production

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/verdifi
SESSION_SECRET=<strong-random-secret>
NODE_ENV=production
ALLOWED_ORIGINS=https://your-domain.com
PORT=3000
```

### MongoDB Atlas Setup

1. Create MongoDB Atlas account
2. Create a cluster (free tier available)
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for Render)
5. Get connection string
6. Update `MONGODB_URI` in environment variables

### Render Deployment

1. Go to Render dashboard
2. Add environment variable: `MONGODB_URI`
3. Add environment variable: `SESSION_SECRET`
4. Deploy

## Troubleshooting

### MongoDB Connection Failed
- Check if MongoDB is running (local)
- Verify connection string (Atlas)
- Check network/firewall settings
- Verify credentials

### Login Not Working
- Check browser console for errors
- Verify MongoDB is connected
- Check session cookie settings
- Clear browser cookies and try again

### Session Not Persisting
- Check `SESSION_SECRET` is set
- Verify MongoDB connection
- Check cookie settings (secure flag in production)

## Testing

Test authentication:

```bash
# Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123"}'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -c cookies.txt

# Test status
curl http://localhost:3000/api/auth/status -b cookies.txt
```

---

**Authentication is now fully integrated!** Users must register/login before accessing the dashboard.

