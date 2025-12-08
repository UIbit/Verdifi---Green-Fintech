#!/bin/bash

# Render Deployment Helper Script
# This script provides instructions for deploying to Render

echo "🎨 Render Deployment Helper"
echo "============================"
echo ""
echo "Render uses a web-based dashboard for deployment."
echo ""
echo "Steps to deploy:"
echo ""
echo "1. Sign up at https://render.com"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your GitHub repository"
echo "4. Configure:"
echo "   - Name: node-carbon-dashboard"
echo "   - Environment: Node"
echo "   - Build Command: npm install"
echo "   - Start Command: npm run dashboard"
echo "   - Instance Type: Free"
echo ""
echo "5. Add Environment Variables:"
echo "   - NODE_ENV=production"
echo "   - PORT=3000"
echo "   - ALLOWED_ORIGINS=https://your-app-name.onrender.com"
echo ""
echo "6. Click 'Create Web Service'"
echo ""
echo "Render will automatically:"
echo "  ✓ Build your application"
echo "  ✓ Deploy to production"
echo "  ✓ Provide HTTPS/SSL certificate"
echo "  ✓ Set up automatic deployments"
echo ""
echo "After deployment, update ALLOWED_ORIGINS with your actual Render URL."
echo ""


