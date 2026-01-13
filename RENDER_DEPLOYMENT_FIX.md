# 🔧 Render Deployment Fix - CORS & 404 Issues

## Issues Encountered
1. ❌ 404 errors on client-side routes
2. ❌ CORS errors accessing backend API
3. ❌ Placeholder backend URL (`your-backend-api.com`)

## ✅ Solutions Applied

### 1. Fixed SPA Routing (404 Fix)
Created `GreenRo-main/public/_redirects`:
```
/* /index.html 200
```
This ensures all routes fallback to `index.html` for React Router.

### 2. Backend Configuration Required

#### Step 1: Deploy Backend to Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Create **New Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `greenroute-backend`
   - **Root Directory**: `Backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

#### Step 2: Set Backend Environment Variables
In Render Backend Service → Environment:
```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=your-mongodb-connection-string
DB_NAME=greenroute
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRE=15m
CORS_ORIGIN=https://green-route-4.onrender.com
```

**⚠️ CRITICAL**: Set `CORS_ORIGIN` to your deployed frontend URL!

#### Step 3: Get Your Backend URL
After deployment, Render gives you a URL like:
```
https://greenroute-backend-xyz.onrender.com
```

### 3. Frontend Configuration Required

#### Step 1: Set Frontend Environment Variables
In Render Static Site → Environment, add:
```bash
REACT_APP_API_URL=https://greenroute-backend-xyz.onrender.com/api
REACT_APP_MAPBOX_TOKEN=your-mapbox-token-here
REACT_APP_ENV=production
NODE_ENV=production
```

**⚠️ IMPORTANT**: 
- Replace `greenroute-backend-xyz` with YOUR actual backend URL
- Include `/api` at the end
- Get Mapbox token from https://account.mapbox.com/

#### Step 2: Redeploy Frontend
After setting environment variables:
1. Go to Render Dashboard → Your Static Site
2. Click **Manual Deploy** → **Clear build cache & deploy**

### 4. Verify Deployment

#### Test Backend
Open in browser:
```
https://greenroute-backend-xyz.onrender.com/
https://greenroute-backend-xyz.onrender.com/api/health
```
Should return JSON responses.

#### Test Frontend
1. Open: `https://green-route-4.onrender.com`
2. Open DevTools → Console (should see no CORS errors)
3. Try logging in (should make API calls to your backend)

## 📋 Checklist

### Backend
- [ ] Web Service created on Render
- [ ] Root Directory set to `Backend`
- [ ] All environment variables configured
- [ ] `CORS_ORIGIN` includes frontend URL
- [ ] Backend URL accessible (test `/api/health`)

### Frontend
- [ ] Static Site created on Render
- [ ] Root Directory set to `GreenRo-main`
- [ ] Publish Directory set to `build`
- [ ] `REACT_APP_API_URL` points to backend with `/api`
- [ ] `REACT_APP_MAPBOX_TOKEN` set
- [ ] Redeployed after setting env vars
- [ ] `_redirects` file in `public/` folder

## 🐛 Common Issues

### Still getting CORS errors?
✅ **Check**: Backend `CORS_ORIGIN` must match frontend URL exactly
```bash
# In Backend Environment on Render:
CORS_ORIGIN=https://green-route-4.onrender.com
```

### API calls still going to placeholder URL?
✅ **Check**: Environment variables in Render Static Site
✅ **Redeploy** after setting variables (build cache cleared)

### Routes still 404?
✅ **Check**: `_redirects` file exists in `GreenRo-main/public/`
✅ **Redeploy** frontend

### Backend not responding?
✅ **Check**: Render backend service logs
✅ **Verify**: MongoDB connection string is correct
✅ **Ensure**: Service is not sleeping (free tier sleeps after inactivity)

## 🚀 Next Steps

1. **Set backend environment variables** in Render
2. **Copy your backend URL** from Render
3. **Set frontend `REACT_APP_API_URL`** with your backend URL + `/api`
4. **Redeploy both services**
5. **Test the app**

## 📞 Support

If issues persist:
1. Check Render service logs (Dashboard → Service → Logs)
2. Verify all environment variables are set
3. Test backend URL directly in browser
4. Check browser DevTools Console for errors
