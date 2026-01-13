# Driver Incoming Requests Debugging Guide

## Issue
Drivers are not receiving incoming ride requests from users, even after:
1. User posts a ride request (trip is created with `isRideRequest: true`)
2. Driver goes online with an active route set
3. Driver polls `/driver/incoming-requests` endpoint

## Changes Made

### Backend Changes (tripRoutes.js)

#### 1. Enhanced Route Matching Algorithm
- **File:** `tripRoutes.js` lines 15-69
- **Changes:**
  - Increased `maxDeviationKm` from 2km to 5km (more lenient)
  - Added comprehensive logging to show which coordinates are being compared
  - Added validation for lat/lng properties
  - Improved error messages to help diagnose missing data

#### 2. Improved set-online Endpoint
- **File:** `tripRoutes.js` lines 667-711
- **Changes:**
  - Added `price` field to stored `activeRoute` (was missing!)
  - Added detailed logging to see what route is being stored
  - Logs driver ID, online status, and the complete route object

#### 3. Enhanced incoming-requests Endpoint
- **File:** `tripRoutes.js` lines 1054-1164
- **Changes:**
  - Changed from `.filter()` + `.map()` to a loop for better error handling
  - Separated matching from non-matching requests
  - Added debug info response with:
    - `totalPendingRequests`: Total trips with `isRideRequest: true`
    - `matchingRequests`: Trips that pass route matching
    - `rejectedRequests`: Trips that don't match (with reason)
  - Added comprehensive console logging
  - Returns more detailed response structure

#### 4. Added Debug Endpoint
- **File:** `tripRoutes.js` lines 1167-1203
- **Route:** `GET /api/trips/driver/debug-matching/:driverId`
- **Purpose:** Allows manual inspection of:
  - Driver's active route
  - All pending user requests
  - Which requests match/don't match
  - Why requests are rejected

### Frontend Changes (DriverDashboard.jsx)

#### 1. Enhanced set-online Logging
- **File:** `DriverDashboard.jsx` lines 84-155
- **Changes:**
  - Logs the route being sent: `console.log('📤 Going online with route:', driverRoute);`
  - Logs the response received from backend
  - Logs any errors that occur

#### 2. Enhanced incoming-requests Logging
- **File:** `DriverDashboard.jsx` lines 181-204
- **Changes:**
  - Logs incoming requests count
  - Logs debug info received from backend
  - Logs error details including response data

## Debugging Steps to Follow

### 1. Check Backend Logs
When a driver goes online:
```
📡 Set-Online Called:
Driver ID: [driver-id]
Is Online: true
Route Received: { origin: {...}, destination: {...}, price: ... }
✅ Active Route Stored: { origin: {...}, destination: {...}, price: ..., ... }
✅ Driver Saved to DB
```

### 2. Check Route Matching Logs
When checking for incoming requests:
```
📨 Incoming Requests Check for Driver [driver-id]
📍 Driver Active Route: { origin: "Place A", destination: "Place B" }
🔍 Total pending requests found: X

🎯 doRoutesMatch called:
Driver Origin Coords: { lat: ..., lng: ... }
Driver Dest Coords: { lat: ..., lng: ... }
User Origin Coords: { lat: ..., lng: ... }
User Dest Coords: { lat: ..., lng: ... }

📍 Origin Distance: X.XXkm (threshold: 5km)
📍 Dest Distance: X.XXkm (threshold: 5km)
✅ Routes Align: true/false
Final Match Result: true/false

✅ Matching requests: X
❌ Non-matching requests: Y
```

### 3. Check Frontend Console
When driver goes online:
```
📤 Going online with route: {
  origin: { name: "...", coordinates: { lat: ..., lng: ... } },
  destination: { name: "...", coordinates: { lat: ..., lng: ... } },
  price: ...
}
✅ Set-online response: { success: true, message: "...", driver: {...} }
```

When fetching incoming requests:
```
📥 Incoming Requests Response: {
  totalRequests: X,
  debugInfo: { totalPendingRequests: X, matchingRequests: Y, rejectedRequests: Z },
  message: "..."
}
```

## Manual Testing via API

### 1. Check Driver's Active Route
```bash
GET /api/trips/driver/debug-matching/{driver-id}
```
Response shows:
- Driver's current active route
- All pending user requests
- Whether each request matches

### 2. Create Test Flow
1. User creates and posts a ride request
2. Note the user's origin and destination
3. Driver sets an identical/similar route
4. Driver goes online
5. Check backend logs to see if routes match
6. Check frontend console for response data

## Common Issues & Solutions

### Issue: Routes not matching
**Possible Causes:**
- Coordinates format is wrong (check for `lat`/`lng` vs `latitude`/`longitude`)
- Coordinates are more than 5km apart
- One of the coordinates is null/undefined

**Solution:**
- Check debug endpoint to see exact coordinates
- Ensure origin/destination names match between user and driver
- Use same geocoding service for consistency

### Issue: activeRoute not being stored
**Possible Causes:**
- Route object is null when `set-online` is called
- Database save failed
- Route structure doesn't match schema

**Solution:**
- Check `driverRoute` state is set before calling toggle
- Review backend logs for save errors
- Verify Trip model matches the route structure

### Issue: Polling not working
**Possible Causes:**
- Driver not marked as online
- Backend returning 401 (auth error)
- Network error

**Solution:**
- Check driver is actually online in database
- Verify token is valid
- Check network tab in DevTools

## Testing Checklist

- [ ] Driver goes online with route logged correctly
- [ ] Backend logs show route is saved to driver.activeRoute
- [ ] User posts a ride request with coordinates
- [ ] Backend shows incoming requests found (totalPendingRequests > 0)
- [ ] doRoutesMatch logs show coordinates being compared
- [ ] Driver receives notification of new request
- [ ] Frontend logs show matchingRequests > 0

## Next Steps if Still Not Working

1. Enable more verbose logging in doRoutesMatch function
2. Compare exact coordinate values from user vs driver
3. Check if coordinates are being truncated/rounded differently
4. Verify database is actually saving the route
5. Check if rate limiting is blocking requests (look for 429 errors)
6. Review authentication tokens to ensure they're valid

