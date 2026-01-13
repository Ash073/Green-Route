# 🚨 CRITICAL: Environment Variables Configuration for Render

## Problem
Your `.env.production` file is NOT being read during Render builds. Render requires environment variables to be set in the dashboard UI.

## Solution

### 1. Configure Frontend Environment Variables in Render

Go to: **Render Dashboard → Your Static Site (green-route-4) → Environment**

Add these **exactly**:

```bash
REACT_APP_API_URL=https://green-route-3.onrender.com/api
REACT_APP_MAPBOX_TOKEN=pk.eyJ1IjoieWVzYXN3aW5pMTUwOCIsImEiOiJjbWZjd3l0ZWkwM2FjMmxzYmR1d2liYWsxIn0.hL64DI3xihWFknOwxEa8qA
REACT_APP_ENV=production
NODE_ENV=production
```

### 2. Configure Backend Environment Variables in Render

Go to: **Render Dashboard → Your Backend Service (green-route-3) → Environment**

Add these:

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-mongodb-uri>
DB_NAME=greenroute
JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
JWT_EXPIRE=15m
CORS_ORIGIN=https://green-route-4.onrender.com
```

**⚠️ IMPORTANT**: Replace `<your-mongodb-uri>`, `<your-secret>`, etc. with real values

### 3. Update Build Command (Optional but Recommended)

In Render Static Site → Settings → Build Command:
```bash
chmod +x build.sh && ./build.sh
```
OR keep default:
```bash
npm install && npm run build
```

### 4. Redeploy

After setting environment variables:
1. Click **Manual Deploy**
2. Select **Clear build cache & deploy**
3. Wait for deployment to complete

### 5. Verify

**Test Backend:**
```bash
curl https://green-route-3.onrender.com/api/health
```
Should return JSON with `"status": "OK"`

**Test Frontend:**
1. Open https://green-route-4.onrender.com
2. Open DevTools → Console
3. Should see API URL pointing to `https://green-route-3.onrender.com/api`
4. Try login — should hit backend, not 404

## Why This Matters

React apps bake environment variables **into the build at compile time**. Setting them after build does nothing. Render needs them set before `npm run build` runs.

### ❌ Wrong (what you were doing):
- `.env.production` file in repo (ignored by Render)
- Variables set after build

### ✅ Correct:
- Variables set in Render Dashboard → Environment
- Redeploy with **clear cache** after setting

## Current Status

✅ Backend URL configured correctly: `https://green-route-3.onrender.com/api`
✅ Mapbox token present
❌ Variables NOT in Render dashboard (causing 404s)
❌ Need to redeploy after adding to dashboard

## Next Steps

1. **NOW**: Add environment variables to Render dashboard
2. **THEN**: Redeploy frontend with cache cleared  
3. **TEST**: https://green-route-4.onrender.com/login
4. **VERIFY**: Check DevTools → Network tab shows requests to `green-route-3.onrender.com`

## Quick Reference

| Service | URL |
|---------|-----|
| Frontend | https://green-route-4.onrender.com |
| Backend | https://green-route-3.onrender.com |
| API Base | https://green-route-3.onrender.com/api |
| Health Check | https://green-route-3.onrender.com/api/health |
