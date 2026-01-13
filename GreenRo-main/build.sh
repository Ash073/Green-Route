#!/bin/bash
# Render Build Script for Frontend
# This ensures environment variables are properly set during build

echo "🔧 Starting GreenRoute Frontend Build..."
echo "📦 Installing dependencies..."
npm install

echo "🌍 Environment Check:"
echo "NODE_ENV: $NODE_ENV"
echo "REACT_APP_API_URL: $REACT_APP_API_URL"
echo "REACT_APP_ENV: $REACT_APP_ENV"

if [ -z "$REACT_APP_API_URL" ]; then
  echo "⚠️  WARNING: REACT_APP_API_URL is not set!"
  echo "Please set it in Render Dashboard → Environment"
  echo "Example: https://your-backend.onrender.com/api"
fi

if [ -z "$REACT_APP_MAPBOX_TOKEN" ]; then
  echo "⚠️  WARNING: REACT_APP_MAPBOX_TOKEN is not set!"
  echo "Get your token from https://account.mapbox.com/"
fi

echo "🏗️  Building React app..."
npm run build

echo "✅ Build complete!"
echo "📂 Build output in: build/"
