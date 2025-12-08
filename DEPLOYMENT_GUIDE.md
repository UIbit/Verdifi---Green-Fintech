# Cloud Deployment Guide for Node Carbon

This guide provides step-by-step instructions for deploying Node Carbon to various cloud platforms.

## 🚀 Quick Deploy Options (Easiest)

### Option 1: Railway (Recommended - Easiest) ⭐

**Railway** is the easiest platform for Node.js apps with automatic deployments.

#### Steps:

1. **Sign up**: Go to https://railway.app and sign up with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Environment Variables**:
   - Go to Settings → Variables
   - Add:
     ```
     NODE_ENV=production
     PORT=3000
     ALLOWED_ORIGINS=https://your-app-name.up.railway.app
     ```

4. **Deploy**:
   - Railway automatically detects `railway.json` and deploys
   - Your app will be live at `https://your-app-name.up.railway.app`

5. **Update CORS** (after deployment):
   - Update `ALLOWED_ORIGINS` with your actual Railway URL

**Time**: ~5 minutes | **Cost**: Free tier available

---

### Option 2: Render ⭐

**Render** offers free hosting with automatic SSL.

#### Steps:

1. **Sign up**: Go to https://render.com and sign up

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

3. **Configure**:
   - **Name**: `node-carbon-dashboard`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run dashboard`
   - **Instance Type**: Free

4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3000
   ALLOWED_ORIGINS=https://your-app-name.onrender.com
   ```

5. **Deploy**:
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Your app will be at `https://your-app-name.onrender.com`

**Time**: ~5 minutes | **Cost**: Free tier available

---

### Option 3: Heroku

**Heroku** is a popular platform-as-a-service.

#### Prerequisites:
- Heroku CLI installed: https://devcenter.heroku.com/articles/heroku-cli
- Git installed

#### Steps:

1. **Install Heroku CLI** (if not installed):
   ```bash
   # Windows: Download from https://devcenter.heroku.com/articles/heroku-cli
   # Or use: npm install -g heroku
   ```

2. **Login to Heroku**:
   ```bash
   heroku login
   ```

3. **Create Heroku App**:
   ```bash
   heroku create your-app-name
   ```

4. **Set Environment Variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set ALLOWED_ORIGINS=https://your-app-name.herokuapp.com
   ```

5. **Deploy**:
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

6. **Open Your App**:
   ```bash
   heroku open
   ```

**Time**: ~10 minutes | **Cost**: Free tier available (with limitations)

---

## 🐳 Docker Deployment (Any Platform)

If you prefer Docker, you can deploy to any platform that supports Docker:

### Build Docker Image:
```bash
docker build -t node-carbon .
```

### Run Locally:
```bash
docker run -p 3000:3000 -e NODE_ENV=production node-carbon
```

### Deploy to Docker Platforms:
- **Docker Hub**: Push and deploy anywhere
- **Fly.io**: `flyctl launch` (uses Dockerfile)
- **DigitalOcean App Platform**: Supports Dockerfiles
- **AWS ECS/Fargate**: Container-based deployment

---

## ☁️ Advanced Cloud Options

### Option 4: AWS (Elastic Beanstalk)

**AWS Elastic Beanstalk** simplifies AWS deployment.

#### Prerequisites:
- AWS account
- AWS CLI installed

#### Steps:

1. **Install AWS CLI**:
   ```bash
   # Windows: Download from https://aws.amazon.com/cli/
   ```

2. **Install EB CLI**:
   ```bash
   pip install awsebcli
   ```

3. **Initialize EB**:
   ```bash
   eb init -p node.js --region us-east-1
   ```

4. **Create Environment**:
   ```bash
   eb create node-carbon-env
   ```

5. **Set Environment Variables**:
   ```bash
   eb setenv NODE_ENV=production ALLOWED_ORIGINS=https://your-app.elasticbeanstalk.com
   ```

6. **Deploy**:
   ```bash
   eb deploy
   ```

**Time**: ~20 minutes | **Cost**: Pay-as-you-go (free tier available)

---

### Option 5: Azure App Service

**Azure App Service** provides managed hosting.

#### Steps:

1. **Install Azure CLI**:
   ```bash
   # Windows: Download from https://aka.ms/installazurecliwindows
   ```

2. **Login**:
   ```bash
   az login
   ```

3. **Create Resource Group**:
   ```bash
   az group create --name node-carbon-rg --location eastus
   ```

4. **Create App Service Plan**:
   ```bash
   az appservice plan create --name node-carbon-plan --resource-group node-carbon-rg --sku FREE
   ```

5. **Create Web App**:
   ```bash
   az webapp create --resource-group node-carbon-rg --plan node-carbon-plan --name your-app-name --runtime "NODE:18-lts"
   ```

6. **Configure**:
   ```bash
   az webapp config appsettings set --resource-group node-carbon-rg --name your-app-name --settings NODE_ENV=production ALLOWED_ORIGINS=https://your-app-name.azurewebsites.net
   ```

7. **Deploy** (using Git):
   ```bash
   az webapp deployment source config --name your-app-name --resource-group node-carbon-rg --repo-url https://github.com/yourusername/node-carbon --branch main --manual-integration
   ```

**Time**: ~15 minutes | **Cost**: Free tier available

---

### Option 6: Google Cloud Run

**Google Cloud Run** is serverless container hosting.

#### Steps:

1. **Install Google Cloud SDK**:
   ```bash
   # Download from https://cloud.google.com/sdk/docs/install
   ```

2. **Login**:
   ```bash
   gcloud auth login
   ```

3. **Set Project**:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

4. **Build and Deploy**:
   ```bash
   gcloud run deploy node-carbon \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production,ALLOWED_ORIGINS=https://your-app-url.run.app
   ```

**Time**: ~15 minutes | **Cost**: Free tier available

---

## 🔧 Post-Deployment Steps

### 1. Update CORS Configuration

After deployment, update `ALLOWED_ORIGINS` with your actual domain:

```bash
# Example for Railway
railway variables set ALLOWED_ORIGINS=https://your-app.up.railway.app

# Example for Render (in dashboard)
ALLOWED_ORIGINS=https://your-app.onrender.com

# Example for Heroku
heroku config:set ALLOWED_ORIGINS=https://your-app.herokuapp.com
```

### 2. Test Your Deployment

```bash
# Test health endpoint
curl https://your-app-url.com/health

# Run penetration test
npm run pen-test https://your-app-url.com
```

### 3. Set Up Monitoring

- Enable logging in your cloud platform
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Configure alerts for errors

### 4. Security Checklist

- [ ] HTTPS enabled (automatic on most platforms)
- [ ] CORS configured correctly
- [ ] Environment variables set securely
- [ ] Security headers configured
- [ ] Rate limiting enabled (if needed)

---

## 📊 Platform Comparison

| Platform | Ease | Free Tier | Auto SSL | Git Deploy | Best For |
|----------|------|-----------|----------|------------|----------|
| **Railway** | ⭐⭐⭐⭐⭐ | ✅ | ✅ | ✅ | Quick deployment |
| **Render** | ⭐⭐⭐⭐⭐ | ✅ | ✅ | ✅ | Simple apps |
| **Heroku** | ⭐⭐⭐⭐ | ⚠️ Limited | ✅ | ✅ | Traditional PaaS |
| **AWS** | ⭐⭐⭐ | ✅ | ✅ | ✅ | Enterprise |
| **Azure** | ⭐⭐⭐ | ✅ | ✅ | ✅ | Microsoft ecosystem |
| **GCP** | ⭐⭐⭐ | ✅ | ✅ | ✅ | Google ecosystem |

---

## 🆘 Troubleshooting

### Common Issues:

1. **Port Configuration**:
   - Most platforms set `PORT` automatically
   - Ensure your code uses `process.env.PORT || 3000`

2. **Build Failures**:
   - Check Node.js version compatibility
   - Ensure all dependencies are in `package.json`
   - Review build logs

3. **CORS Errors**:
   - Update `ALLOWED_ORIGINS` with your actual domain
   - Include protocol (`https://`) in origins

4. **Socket.IO Issues**:
   - Ensure WebSocket support is enabled
   - Check platform-specific WebSocket configuration

### Getting Help:

- Check platform documentation
- Review deployment logs
- Test locally first: `npm run dashboard`

---

## 🎯 Recommended: Railway or Render

For the easiest deployment experience, I recommend:

1. **Railway** - Best for automatic deployments and simplicity
2. **Render** - Best for free tier with good features

Both platforms:
- ✅ Free tier available
- ✅ Automatic SSL certificates
- ✅ Git-based deployments
- ✅ Easy environment variable configuration
- ✅ Built-in monitoring

---

## 📝 Quick Commands Reference

```bash
# Railway
railway login
railway init
railway up

# Render
# Use web dashboard at render.com

# Heroku
heroku login
heroku create
git push heroku main

# AWS EB
eb init
eb create
eb deploy

# Azure
az login
az webapp create
az webapp deployment source config

# Google Cloud
gcloud run deploy
```

---

**Ready to deploy?** Choose a platform above and follow the steps! 🚀


