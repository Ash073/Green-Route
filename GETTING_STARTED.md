# Getting Started After Week 2

## 🎯 Current State

Your GreenRoute application is now **fully functional** with:
- Real database trip management
- Secure token-based authentication
- Automatic token refresh
- Comprehensive error handling
- Form validation
- Production-ready logging

---

## 🚀 Starting the Application

### Terminal 1: Backend
```bash
cd Backend
npm run dev
```
Expected output:
```
[TIME] [Server] [INFO] Starting application in development environment
[TIME] [Server] [INFO] Attempting to connect to MongoDB...
[TIME] [Server] [INFO] Connected to MongoDB
[TIME] [Server] [INFO] Server running on port 5000
```

### Terminal 2: Frontend
```bash
cd GreenRo-main
npm start
```
Expected output:
```
webpack compiled successfully
Compiled successfully!

On Your Network: http://xxx.xxx.xxx.xxx:3002
```

---

## ✅ Verify Everything Works

### 1. Health Check
```bash
curl https://green-route-3.onrender.com/api/health
```

### 2. Test Signup
1. Go to http://localhost:3002
2. Click "Sign Up"
3. Fill in details with validation feedback
4. Submit and verify success message

### 3. Test Login
1. Use credentials from signup
2. Verify token-based authentication

### 4. Test Trip API
1. Create a trip
2. View your trips (should use database)
3. Update trip status
4. Delete trip

---

## 📁 Project Structure

```
green-route-main/
├── Backend/                    Express.js server
│   ├── models/                Database schemas
│   ├── middleware/            Auth, error handling, tokens
│   ├── utils/                 Logging utilities
│   ├── validators/            Input validation
│   ├── authRoutes.js          Auth endpoints
│   ├── tripRoutes.js          Trip endpoints
│   ├── server.js              Express app
│   ├── package.json
│   ├── .env                   Environment variables
│   └── .gitignore
│
├── GreenRo-main/              React application
│   ├── src/
│   │   ├── api/              API client & endpoints
│   │   ├── components/       React components
│   │   ├── contexts/         Auth context
│   │   ├── hooks/            Custom hooks
│   │   ├── utils/            Validation & helpers
│   │   ├── pages/            Page components
│   │   ├── App.jsx
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   ├── .env.local            Frontend env vars
│   └── .gitignore
│
└── Documentation/
    ├── IMPROVEMENTS_WEEK1.md
    ├── IMPROVEMENTS_WEEK2.md
    ├── WEEK1_SUMMARY.md
    ├── WEEK2_SUMMARY.md
    ├── WEEK2_COMPLETION_REPORT.md
    ├── QUICK_START.md
    └── GETTING_STARTED.md (this file)
```

---

## 🔑 Key Features Implemented

### Authentication
```javascript
// Signup/Login - Returns access + refresh tokens
const { accessToken, refreshToken } = await authAPI.login({
  email: 'user@example.com',
  password: 'password'
});

// Token refresh (automatic!)
// No action needed - apiClient handles it

// Logout
await authAPI.logout(refreshToken);
```

### Trip Management
```javascript
// Save trip
await tripAPI.saveTrip({
  origin: { ... },
  destination: { ... },
  selectedRoute: { ... }
});

// Get trips
const trips = await tripAPI.getUserTrips(userId);

// Update status
await tripAPI.updateTripStatus(tripId, 'completed');

// Get statistics
const stats = await tripAPI.getTripStats(userId);
```

### Error Handling
```jsx
// Automatic error boundary
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Display errors to user
<ErrorMessage message={error} onDismiss={() => setError(null)} />
<SuccessMessage message="Success!" />
```

### Form Validation
```jsx
// Real-time validation
import { validateSignupForm } from '../utils/validation.js';

const validation = validateSignupForm(name, email, password, confirmPassword);
if (!validation.valid) {
  // Show errors: validation.errors
}
```

### Logging
```javascript
// In backend routes
const logger = createLogger('MyModule');
logger.info('User action', { userId, action });
logger.error('Error occurred', { error });
```

---

## 🔐 Environment Variables

### Backend `.env`
```
MONGODB_URI=mongodb+srv://...
DB_NAME=yash
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3002
LOG_LEVEL=debug
```

### Frontend `.env.local`
```
REACT_APP_API_URL=https://green-route-3.onrender.com/api
REACT_APP_MAPBOX_TOKEN=your-mapbox-token
REACT_APP_ENV=development
```

---

## 📝 API Endpoints Reference

### Authentication
```
POST   /api/auth/signup          - Create user account
POST   /api/auth/login           - Login and get tokens
POST   /api/auth/refresh         - Refresh access token
POST   /api/auth/logout          - Logout
POST   /api/auth/logout-all      - Logout from all devices
GET    /api/auth/me              - Get current user
```

### Trips
```
POST   /api/trips/save                  - Create trip
GET    /api/trips/user/:userId         - Get user's trips
GET    /api/trips/:tripId              - Get trip details
PUT    /api/trips/:tripId              - Update trip
PATCH  /api/trips/:tripId/status       - Update trip status
DELETE /api/trips/:tripId              - Delete trip
GET    /api/trips/stats/:userId        - Get carbon statistics
```

---

## 🧪 Common Tasks

### Add a New API Endpoint

1. **Create the route handler** in `Backend/tripRoutes.js` or `Backend/authRoutes.js`:
```javascript
router.post('/new-endpoint', authenticateToken, asyncHandler(async (req, res) => {
  // Your code here
  const logger = createLogger('YourModule');
  logger.info('Endpoint called');
  
  res.json({ success: true, data: result });
}));
```

2. **Add API client function** in `Frontend/src/api/endpoints.js`:
```javascript
export const tripAPI = {
  newEndpoint: (data) => apiClient.post('/trips/new-endpoint', data)
};
```

3. **Use in component**:
```jsx
const response = await tripAPI.newEndpoint(data);
```

### Add Form Validation

1. **Add validator function** in `Frontend/src/utils/validation.js`:
```javascript
export const validateMyField = (value) => {
  if (value.length < 2) {
    return { valid: false, errors: { myField: 'Too short' } };
  }
  return { valid: true, errors: {} };
};
```

2. **Use in component**:
```javascript
const validation = validateMyField(value);
if (!validation.valid) {
  setErrors(validation.errors);
}
```

### Add Logging

**Backend:**
```javascript
import { createLogger } from './utils/logger.js';

const logger = createLogger('MyModule');
logger.info('User action', { userId, action });
logger.error('Error occurred', { errorDetails });
```

---

## 🐛 Debugging

### Check Backend Logs
```bash
# Console output
npm run dev

# File logs (production)
tail -f Backend/logs/2026-01-08.log
```

### Check Frontend Console
```
Open Developer Tools (F12)
Check Console tab for errors
Check Network tab for API calls
```

### Common Issues

**Issue: "MONGODB_URI not found"**
- Solution: Add MONGODB_URI to Backend/.env

**Issue: "Token expired" error**
- Solution: This is handled automatically! Frontend refreshes token

**Issue: Form validation not working**
- Solution: Import validation function and call it on change/submit

**Issue: API returns 401 Unauthorized**
- Solution: Check Authorization header includes "Bearer" + token

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| GETTING_STARTED.md | This file - quick setup guide |
| QUICK_START.md | API endpoints and quick reference |
| IMPROVEMENTS_WEEK1.md | Week 1 detailed improvements |
| IMPROVEMENTS_WEEK2.md | Week 2 detailed improvements |
| WEEK2_COMPLETION_REPORT.md | Week 2 completion details |

---

## 🎯 What's Next?

### Immediate (This Week)
- [ ] Test all endpoints thoroughly
- [ ] Add more trip features if needed
- [ ] Deploy to staging environment
- [ ] Get user feedback

### Short Term (Next Week)
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Add E2E tests
- [ ] Performance optimization

### Medium Term (Week 3+)
- [ ] Leaderboard feature
- [ ] Social sharing
- [ ] Push notifications
- [ ] Analytics dashboard

---

## 💡 Tips

1. **Always restart backend** after changing `.env` variables
2. **Check logs** first when debugging issues
3. **Use error messages** as guides for form validation
4. **Test token refresh** by waiting 15 minutes
5. **Keep endpoints consistent** with existing pattern

---

## 📞 Quick Reference Commands

```bash
# Start backend
cd Backend && npm run dev

# Start frontend
cd GreenRo-main && npm start

# Install new backend package
cd Backend && npm install package-name --save

# Check logs
tail -f Backend/logs/2026-01-08.log

# Test API endpoint
curl https://green-route-3.onrender.com/api/health
```

---

## ✨ You're All Set!

The application is now ready for:
- ✅ Development
- ✅ Testing
- ✅ Deployment
- ✅ User feedback

**Happy coding!** 🚀

---

Generated: January 8, 2026
