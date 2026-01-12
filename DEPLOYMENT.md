# 🚀 GreenRoute Deployment Guide

## Overview
GreenRoute is a full-stack ride-sharing application with separate frontend (React) and backend (Node.js/Express/MongoDB) deployments.

---

## 📋 Pre-Deployment Checklist

### Required Accounts
- [ ] MongoDB Atlas account (free tier available)
- [ ] Mapbox account with API token
- [ ] Choose hosting platform:
  - **Backend**: Render, Railway, Heroku, or Vercel
  - **Frontend**: Netlify, Vercel, or Render

### Required Credentials
- [ ] MongoDB connection string
- [ ] Mapbox access token
- [ ] JWT secrets (generate secure random strings)

---

## 🎯 Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend) ⭐ RECOMMENDED

#### **Frontend Deployment on Vercel**

1. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

2. **Deploy via Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Create React App
     - **Root Directory**: `GreenRo-main`
     - **Build Command**: `npm run build`
     - **Output Directory**: `build`

3. **Set Environment Variables**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   REACT_APP_MAPBOX_TOKEN=your_mapbox_token
   REACT_APP_ENV=production
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at: `https://your-app.vercel.app`

#### **Backend Deployment on Render**

1. **Go to Render Dashboard**
   - Visit [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   ```
   Name: greenroute-backend
   Region: Choose closest to your users
   Branch: main
   Root Directory: Backend
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/greenroute
   DB_NAME=greenroute
   JWT_SECRET=generate_32_char_random_string
   JWT_REFRESH_SECRET=another_32_char_random_string
   JWT_EXPIRE=15m
   CORS_ORIGIN=https://your-frontend.vercel.app
   PORT=5000
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment
   - Copy your backend URL

5. **Update Frontend Environment**
   - Go back to Vercel
   - Update `REACT_APP_API_URL` with Render backend URL
   - Redeploy frontend

---

### Option 2: Netlify (Frontend) + Railway (Backend)

#### **Frontend on Netlify**

1. **Deploy via Netlify Dashboard**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect GitHub repository
   
2. **Build Settings**
   ```
   Base directory: GreenRo-main
   Build command: npm run build
   Publish directory: GreenRo-main/build
   ```

3. **Environment Variables**
   ```
   REACT_APP_API_URL=https://your-backend.railway.app/api
   REACT_APP_MAPBOX_TOKEN=your_mapbox_token
   REACT_APP_ENV=production
   ```

#### **Backend on Railway**

1. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Set root directory to `Backend`

2. **Environment Variables**
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   DB_NAME=greenroute
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   JWT_EXPIRE=15m
   CORS_ORIGIN=https://your-app.netlify.app
   ```

3. **Generate Domain**
   - Railway will auto-generate a domain
   - Update frontend's `REACT_APP_API_URL`

---

### Option 3: All-in-One Vercel Deployment

Deploy both frontend and backend on Vercel (requires pro plan for backend or use serverless functions).

---

## 🗄️ MongoDB Atlas Setup

1. **Create Cluster**
   - Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Create free cluster
   - Choose cloud provider and region

2. **Create Database User**
   - Database Access → Add New Database User
   - Choose password authentication
   - Set username and strong password

3. **Whitelist IP Addresses**
   - Network Access → Add IP Address
   - For testing: Add `0.0.0.0/0` (allows all IPs)
   - For production: Add your hosting provider's IP ranges

4. **Get Connection String**
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<username>`, `<password>`, and `<dbname>`

---

## 🗺️ Mapbox Setup

1. **Create Account**
   - Go to [mapbox.com](https://www.mapbox.com)
   - Sign up for free account

2. **Get Access Token**
   - Go to Account → Tokens
   - Copy your default public token
   - Or create a new token with specific scopes

3. **Add to Environment Variables**
   - Use in both frontend and backend `.env` files

---

## 🔐 Security Best Practices

### Generate Secure JWT Secrets

**Using Node.js:**
```javascript
// Run in Node.js console
require('crypto').randomBytes(32).toString('hex')
```

**Using OpenSSL:**
```bash
openssl rand -hex 32
```

### Environment Variables Checklist
- [ ] Never commit `.env` files to git
- [ ] Use different JWT secrets for dev/production
- [ ] Rotate secrets periodically
- [ ] Use strong MongoDB passwords
- [ ] Restrict CORS origins to your domains only

---

## 🔍 Testing Production Build Locally

### Frontend
```bash
cd GreenRo-main

# Create production env file
cp .env.production .env.local

# Update .env.local with your values

# Build
npm run build

# Test build locally
npx serve -s build
```

### Backend
```bash
cd Backend

# Create production env file
cp .env.production .env

# Update .env with your values

# Run in production mode
NODE_ENV=production npm start
```

---

## 🐛 Common Deployment Issues

### Issue: CORS Errors
**Solution:** Ensure `CORS_ORIGIN` in backend matches frontend URL exactly
```env
CORS_ORIGIN=https://your-app.vercel.app,https://your-app.netlify.app
```

### Issue: API Connection Failed
**Solution:** 
- Check `REACT_APP_API_URL` is correct
- Verify backend is running and accessible
- Check browser console for exact error

### Issue: MongoDB Connection Failed
**Solution:**
- Verify MongoDB Atlas cluster is running
- Check IP whitelist includes `0.0.0.0/0` or hosting provider IPs
- Confirm connection string is correct
- Ensure database user has correct permissions

### Issue: Build Fails
**Solution:**
- Check all dependencies are in `package.json`
- Verify Node version compatibility (use Node 18+)
- Clear cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `npm install`

### Issue: Environment Variables Not Working
**Solution:**
- Frontend vars must start with `REACT_APP_`
- Restart dev server after changing env vars
- Redeploy after updating env vars on hosting platform

---

## 📊 Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] Can register new user
- [ ] Can login
- [ ] Can search for routes
- [ ] Map displays correctly
- [ ] API calls work
- [ ] No console errors
- [ ] Mobile responsive
- [ ] HTTPS enabled
- [ ] Custom domain configured (optional)

---

## 🔄 Continuous Deployment

### Auto-Deploy from GitHub

**Vercel:**
- Automatically deploys on push to main branch
- Create `.vercelignore` to exclude files

**Netlify:**
- Auto-deploys on git push
- Configure in Site Settings → Build & Deploy

**Render:**
- Auto-deploys from connected branch
- Configure in service settings

---

## 📈 Monitoring & Analytics

### Recommended Tools
- **Error Tracking**: Sentry
- **Analytics**: Google Analytics, Plausible
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Performance**: Vercel Analytics, Lighthouse

### Add Health Check Endpoint

Already included in `Backend/app.js`:
```javascript
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});
```

---

## 💰 Cost Estimates

### Free Tier Options
- **MongoDB Atlas**: 512MB storage (free forever)
- **Vercel**: 100GB bandwidth/month
- **Netlify**: 100GB bandwidth/month
- **Render**: 750 hours/month free tier
- **Railway**: $5 free credit/month

### Paid Options (if needed)
- **MongoDB Atlas**: ~$9/month (M10 cluster)
- **Vercel Pro**: $20/month
- **Render**: $7/month per service
- **Railway**: Pay as you go

---

## 🎓 Helpful Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment)

---

## 🆘 Support

If you encounter issues:
1. Check browser console for errors
2. Check backend logs on hosting platform
3. Verify all environment variables
4. Review deployment logs
5. Test API endpoints directly using Postman/Thunder Client

---

## 📝 Quick Commands Reference

```bash
# Frontend
cd GreenRo-main
npm install
npm run build
npm start

# Backend
cd Backend
npm install
npm start

# Production test
NODE_ENV=production npm start
```

---

**Last Updated:** January 2026
**Version:** 1.0.0
