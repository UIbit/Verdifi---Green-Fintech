#!/bin/bash

# Railway Deployment Script
# This script helps deploy Node Carbon to Railway

set -e

echo "🚂 Railway Deployment Helper"
echo "=============================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "⚠️  Railway CLI not found. Installing..."
    echo ""
    echo "Please install Railway CLI:"
    echo "  npm install -g @railway/cli"
    echo ""
    echo "Or visit: https://docs.railway.app/develop/cli"
    exit 1
fi

echo "✓ Railway CLI found"
echo ""

# Login check
echo "Checking Railway login status..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

echo "✓ Logged in to Railway"
echo ""

# Initialize project
if [ ! -f ".railway" ]; then
    echo "Initializing Railway project..."
    railway init
else
    echo "✓ Railway project already initialized"
fi

echo ""
echo "Setting environment variables..."
echo ""

# Get the app URL (if available)
APP_URL=$(railway domain 2>/dev/null || echo "")

if [ -z "$APP_URL" ]; then
    echo "⚠️  App URL not found. You may need to set it manually."
    echo "Please enter your Railway app URL (e.g., https://your-app.up.railway.app):"
    read -r APP_URL
fi

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3000

if [ -n "$APP_URL" ]; then
    railway variables set ALLOWED_ORIGINS="$APP_URL"
    echo "✓ Set ALLOWED_ORIGINS to $APP_URL"
else
    echo "⚠️  Please set ALLOWED_ORIGINS manually after deployment"
fi

echo ""
echo "Deploying to Railway..."
echo ""

# Deploy
railway up

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your app should be available at: $APP_URL"
echo ""
echo "Next steps:"
echo "1. Visit your Railway dashboard to view logs"
echo "2. Test your app: curl $APP_URL/health"
echo "3. Run security scan: npm run pen-test $APP_URL"
echo ""


