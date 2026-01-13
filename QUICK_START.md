# GreenRoute - Quick Reference Guide

## 🚀 Starting the Application

### Backend
```bash
cd Backend
npm install  # First time only
npm run dev  # Start with nodemon
# or: node server.js
```
**Server runs on:** `https://green-route-3.onrender.com`

### Frontend
```bash
cd GreenRo-main
npm install  # First time only
npm start
```
**App runs on:** `http://localhost:3002` (or next available port)

---

## 📋 Environment Setup

### Backend (.env)
```
MONGODB_URI=mongodb+srv://yesh:12345@cluster0.70qojkq.mongodb.net/yash
DB_NAME=yash
JWT_SECRET=O/54ZqDaJcxEaKDkOsaohYGL0JeZNINBzpng79cwyzg
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002
LOG_LEVEL=debug
```

### Frontend (.env.local)
```
REACT_APP_API_URL=https://green-route-3.onrender.com/api
REACT_APP_MAPBOX_TOKEN=pk.eyJ1IjoieWVzYXN3aW5pMTUwOCIsImEiOiJjbWZjd3l0ZWkwM2FjMmxzYmR1d2liYWsxIn0.hL64DI3xihWFknOwxEa8qA
REACT_APP_ENV=development
```

---

## 🔑 API Endpoints

### Authentication

**POST** `/api/auth/signup`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```
Response:
```json
{
  "success": true,
  "message": "User created successfully",
  "user": { "_id", "name", "email", "userType" },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

**POST** `/api/auth/login`
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
Returns: `{ accessToken, refreshToken, user }`

**POST** `/api/auth/refresh` ⭐ NEW
```json
{
  "refreshToken": "your-refresh-token"
}
```
Returns: `{ accessToken, refreshToken }` - Auto-called on 401

**GET** `/api/auth/me` (Protected)
- Returns current user information

**POST** `/api/auth/logout` (Protected)
- Revokes refresh token
```json
{
  "refreshToken": "your-refresh-token"
}
```

**POST** `/api/auth/logout-all` (Protected) ⭐ NEW
- Logout from all devices by revoking all refresh tokens

### Trips

**POST** `/api/trips/save` (Protected)
```json
{
  "origin": { "name": "...", "coordinates": { "lng": 72.8, "lat": 19.0 } },
  "destination": { "name": "...", "coordinates": { "lng": 73.0, "lat": 19.1 } },
  "selectedRoute": { "distance": 5000, "duration": 300, "emission": 1.2, ... },
  "alternativeRoutes": [...],
  "emissionSavings": { "amount": 0.5, "percentage": 10 }
}
```
Response: `{ success: true, trip: {...} }`

**GET** `/api/trips/user/:userId` (Protected) ⭐ PAGINATION SUPPORT
Query: `?page=1&limit=10&status=completed`
- Get all trips for a user

**GET** `/api/trips/:tripId` (Protected)
- Get specific trip

**PUT** `/api/trips/:tripId` (Protected)
- Update trip details

**PATCH** `/api/trips/:tripId/status` (Protected) ⭐ NEW
```json
{
  "status": "completed"  // or: planned, in-progress, cancelled
}
```

**DELETE** `/api/trips/:tripId` (Protected)
- Delete trip

**GET** `/api/trips/stats/:userId` (Protected)
- Get trip statistics with carbon savings breakdown

### Routes (Mock)

**GET** `/api/routes?origin=location&destination=location&mode=driving`
- Returns mock route data

### Health Check

**GET** `/api/health`
```json
{
  "success": true,
  "status": "OK",
  "message": "Backend is running",
  "mongodb": "Connected",
  "port": 5000,
  "environment": "development"
}
```

---

### Analytics ⭐ NEW

**GET** `/api/analytics/summary` (Protected)
- Returns a summary for the authenticated user:
```json
{
  "success": true,
  "data": {
    "totalTrips": 12,
    "completedTrips": 8,
    "totalDistance": 123456,
    "totalEmission": 42.5,
    "totalSavings": 6.75
  }
}
```

Note: Stats endpoint `/api/trips/stats/:userId` now caches responses for ~60s and returns `{ cached: boolean }`.

---

## 📁 Project Structure

```
green-route-main/
│
├── Backend/
│   ├── models/
│   │   ├── User.js              # User schema + password hashing
│   │   └── Trip.js              # Trip schema + indexing
│   │
│   ├── middleware/
│   │   ├── errorHandler.js      # Error handling + async wrapper + logging
│   │   ├── auth.js              # JWT authentication
│   │   ├── tokenManager.js      # Token generation + refresh
│   │   └── rateLimit.js         # Rate limiting ⭐ NEW
│   │
│   ├── validators/
│   │   └── inputValidator.js    # Input validation
│   │
│   ├── utils/
│   │   ├── logger.js            # Logging system
│   │   └── cache.js             # LRU cache ⭐ NEW
│   │
│   ├── authRoutes.js            # Auth endpoints
│   ├── tripRoutes.js            # Trip endpoints (real DB)
│   ├── analyticsRoutes.js       # Analytics endpoints ⭐ NEW
│   ├── app.js                   # Express app (no side effects) ⭐ NEW
│   ├── db.js                    # DB helpers (connect/disconnect) ⭐ NEW
│   ├── server.js                # Server startup (connect + listen)
│   ├── .env                     # Environment variables (DON'T COMMIT)
│   ├── .env.example             # Template
│   ├── .gitignore
│   └── package.json
│
├── GreenRo-main/
│   ├── src/
│   │   ├── api/
│   │   │   ├── apiClient.js     # Axios + interceptors
│   │   │   └── endpoints.js     # API functions
│   │   │
│   │   ├── components/
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx  # Auth state management + refresh
│   │   ├── hooks/
│   │   │   └── useAsync.js      # Custom hooks
│   │   ├── pages/
│   │   │   ├── AnalyticsPage.jsx # Analytics summary ⭐ NEW
│   │   │   └── ...
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── index.js
│   │
│   ├── public/
│   ├── .env.local               # Frontend env vars (DON'T COMMIT)
│   ├── .env.local.example       # Template
│   ├── .gitignore
│   ├── package.json
│   └── package-lock.json
│
├── IMPROVEMENTS_WEEK1.md        # Week 1 improvements
├── IMPROVEMENTS_WEEK2.md        # Week 2 improvements
└── IMPROVEMENTS_WEEK3.md        # Week 3 improvements ⭐ NEW
```

---

## 💻 Using the API Client

### In Components

```jsx
import { authAPI, tripAPI } from '../api/endpoints.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export function MyComponent() {
  const { user, login, logout } = useAuth();

  // Login
  const handleLogin = async () => {
    const result = await authAPI.login({ 
      email: 'user@example.com', 
      password: 'password' 
    });
    if (result.success) {
      login(result.user, result.token);
    }
  };

  // Save trip
  const handleSaveTrip = async (tripData) => {
    try {
      const response = await tripAPI.saveTrip(tripData);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return <div>...</div>;
}
```

---

## 🔒 Security Checklist

- ✅ Secrets in .env (not in code)
- ✅ .env files in .gitignore
- ✅ Passwords hashed with bcryptjs
- ✅ JWT tokens in Authorization header
- ✅ CORS whitelist configured
- ✅ Input validation on signup/login
- ✅ Error messages don't expose sensitive data

---

## 🧪 Testing

### Run Backend Tests ⭐ NEW
```bash
cd Backend
npm install
npm run test
```

Uses Node's built-in test runner with an in-memory MongoDB.

### Test Signup
```bash
curl -X POST https://green-route-3.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Login
```bash
curl -X POST https://green-route-3.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Protected Route (with token)
```bash
curl -X GET https://green-route-3.onrender.com/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## ⚠️ Common Issues

### Issue: "MONGODB_URI not found"
**Solution:** Add MONGODB_URI to Backend/.env

### Issue: "Cannot find module 'models/User.js'"
**Solution:** Make sure you're importing with correct path: `import User from './models/User.js'`

### Issue: "CORS error"
**Solution:** 
- Check frontend URL is in CORS_ORIGIN
- Restart backend server
- Check .env is loaded correctly

### Issue: "Token invalid"
**Solution:**
- JWT_SECRET in backend .env matches token creation
- Token is present in Authorization header
- Token hasn't expired (check JWT_EXPIRE)

### Issue: "Cannot POST /api/auth/signup"
**Solution:**
- Check backend is running
- Check API_URL in frontend .env
- Check spelling of endpoint

---

## 📚 Key Files to Understand

1. **Backend**
   - `server.js` - Main Express app
   - `middleware/errorHandler.js` - Error handling
   - `models/User.js` - User schema + methods
   - `authRoutes.js` - Auth endpoints

2. **Frontend**
   - `api/apiClient.js` - Axios configuration
   - `api/endpoints.js` - API calls
   - `contexts/AuthContext.jsx` - Auth state

---

## 🎯 Next Steps

Week 2 ✅ COMPLETE:
1. ✅ Connect real trip API endpoints
2. ✅ Add token refresh mechanism
3. ✅ Implement loading states
4. ✅ Add error boundaries
5. ✅ Complete trip CRUD operations

### 💻 Using the API Client

### ⭐ Token Refresh (Automatic)

Tokens automatically refresh when expired:

```jsx
// No need to manually call refresh!
// apiClient handles it automatically

const response = await tripAPI.getUserTrips(userId);
// If access token expires → auto-refresh → retry request
// If refresh fails → redirect to login
```

### ⭐ Error Handling with Alert Components

Display errors/success messages to users:

```jsx
import { ErrorMessage, SuccessMessage } from '../components/Alert.jsx';

export function MyForm() {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (data) => {
    try {
      await authAPI.login(data);
      setSuccess('Logged in successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {success && <SuccessMessage message={success} onDismiss={() => setSuccess(null)} />}
      <input type="email" placeholder="Email" />
      <button type="submit">Login</button>
    </form>
  );
}
```

### ⭐ Form Validation

Real-time validation before submission:

```jsx
    ### Backend (.env)
    ```
    MONGODB_URI=mongodb+srv://yesh:12345@cluster0.70qojkq.mongodb.net/yash
    DB_NAME=yash
    JWT_SECRET=O/54ZqDaJcxEaKDkOsaohYGL0JeZNINBzpng79cwyzg
    JWT_REFRESH_SECRET=your-refresh-secret-key  # ⭐ NEW - Different from JWT_SECRET
    JWT_EXPIRE=15m  # ⭐ Changed from 7d to 15m for access token
    JWT_REFRESH_EXPIRE=7d  # ⭐ NEW - Refresh token expires in 7 days
    PORT=5000
    NODE_ENV=development
    CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002
    LOG_LEVEL=debug  # ⭐ NEW - Set to: error, warn, info, debug
    ```
import { validateSignupForm } from '../utils/validation.js';
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateSignupForm(name, email, password, confirmPassword);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    // Submit form...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" onChange={handleChange} />
      {errors.email && <span className="error">{errors.email}</span>}
    </form>
  );
}
```

### In Components

Week 3 Ready:
1. Integration and E2E tests
2. Performance optimization
3. Advanced analytics dashboard
4. Real-time notifications
5. Social features (leaderboards)

---

## 📞 Support

For detailed information, see: `IMPROVEMENTS_WEEK1.md`

For API details, check endpoint files in:
- Backend: `authRoutes.js`, `tripRoutes.js`
- Frontend: `src/api/endpoints.js`
