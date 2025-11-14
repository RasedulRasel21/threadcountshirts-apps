# Complete Setup Guide - Shopify File Upload System

This guide will walk you through the complete setup process from development to production deployment on Digital Ocean.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Testing Locally](#testing-locally)
5. [Digital Ocean Deployment](#digital-ocean-deployment)
6. [Frontend Configuration](#frontend-configuration)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This system consists of:

- **Backend API** (Node.js + Express): Handles file uploads to Shopify CDN
- **Frontend Integration** (Shopify Liquid): Upload interface in product pages
- **Configuration System**: Easy switching between environments

### How it Works

1. User uploads a file via the Shopify product page
2. File is sent to your API server
3. API uploads the file to Shopify Files using Admin API
4. Shopify returns a CDN URL for the file
5. The URL is stored in the order properties

---

## Prerequisites

Before starting, ensure you have:

- ✅ Node.js 18+ installed ([Download](https://nodejs.org/))
- ✅ Docker & Docker Compose installed ([Download](https://docs.docker.com/get-docker/))
- ✅ Git installed
- ✅ Shopify store with admin access
- ✅ Shopify custom app with Files read/write permissions
- ✅ Digital Ocean account (for deployment)
- ✅ Terminal/Command line access

---

## Local Development Setup

### Step 1: Install Dependencies

```bash
cd shopify-upload-api
npm install
```

### Step 2: Configure Environment

The `.env` file is already created with your credentials:

```env
PORT=3000
NODE_ENV=development
SHOPIFY_SHOP=thereadcounts.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-shopify-access-token
SHOPIFY_API_VERSION=2025-10
SHOPIFY_API_SECRET=your-shopify-api-secret
```

⚠️ **Security Note**: These credentials are for your private app. Never commit them to public repositories.

### Step 3: Start Development Server

**Option A: Using Node directly**
```bash
npm run dev
```

**Option B: Using Docker (recommended)**
```bash
docker-compose up -d
```

The API will be available at: `http://localhost:3000`

---

## Testing Locally

### Test 1: Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-14T...",
  "shop": "thereadcounts.myshopify.com",
  "apiVersion": "2025-10"
}
```

### Test 2: File Upload

You can use the provided test script:

```bash
./test-upload.sh
```

Or manually test with curl:

```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@/path/to/your/image.png"
```

Expected response:
```json
{
  "success": true,
  "url": "https://cdn.shopify.com/s/files/...",
  "fileId": "gid://shopify/MediaImage/...",
  "filename": "image.png"
}
```

### Test 3: Test with Shopify Store

Since your frontend is already configured to use `http://localhost:3000/upload`, you can:

1. Open your Shopify store in development mode:
   ```bash
   shopify theme dev
   ```

2. Navigate to a product page with custom design enabled

3. Try uploading a file through the UI

4. Check the browser console for upload logs

---

## Digital Ocean Deployment

### Option 1: App Platform (Recommended - Easiest)

#### Step 1: Prepare Repository

If you haven't already, initialize git and push to GitHub/GitLab:

```bash
cd shopify-upload-api

# Initialize git
git init

# Add files
git add .

# Commit
git commit -m "Initial setup for Shopify upload API"

# Add remote (use your own repository URL)
git remote add origin https://github.com/yourusername/shopify-upload-api.git

# Push
git push -u origin main
```

#### Step 2: Create App on Digital Ocean

1. Go to [Digital Ocean App Platform](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Choose **GitHub** or **GitLab** as source
4. Authorize Digital Ocean to access your repositories
5. Select your `shopify-upload-api` repository
6. Choose the `main` branch
7. Click **Next**

#### Step 3: Configure App

**Basic Settings:**
- **Name**: `shopify-upload-api`
- **Region**: Choose closest to your customers (e.g., NYC for US East)
- **Plan**: Professional ($12/month recommended)

**Environment Variables:**

Click "Edit" next to "Environment Variables" and add:

| Key | Value |
|-----|-------|
| `PORT` | `3000` |
| `NODE_ENV` | `production` |
| `SHOPIFY_SHOP` | `thereadcounts.myshopify.com` |
| `SHOPIFY_ACCESS_TOKEN` | `your-shopify-access-token` |
| `SHOPIFY_API_VERSION` | `2025-10` |
| `SHOPIFY_API_SECRET` | `your-shopify-api-secret` |

**Build Settings:**
- Build Command: `npm install`
- Run Command: `node server.js`

#### Step 4: Deploy

1. Click **"Create Resources"**
2. Wait 5-10 minutes for deployment
3. Once complete, you'll get a URL like:
   ```
   https://shopify-upload-api-xxxxx.ondigitalocean.app
   ```

4. **Test your deployment:**
   ```bash
   curl https://your-app-url.ondigitalocean.app/health
   ```

#### Step 5: (Optional) Setup Custom Domain

1. In Digital Ocean App settings, go to "Settings" > "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `api.yourdomain.com`)
4. Add the provided DNS records to your domain registrar
5. Wait for DNS propagation (can take up to 24 hours)
6. Digital Ocean will automatically provision SSL certificate

---

### Option 2: Droplet with Docker

#### Step 1: Create Droplet

1. Go to [Digital Ocean Droplets](https://cloud.digitalocean.com/droplets)
2. Click **"Create Droplet"**
3. Choose:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic - $12/month (2GB RAM, 1 CPU)
   - **Datacenter**: Closest to your customers
   - **Authentication**: SSH Key (add your public key)
   - **Hostname**: `shopify-upload-api`

#### Step 2: Connect to Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

#### Step 3: Install Docker

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Start Docker
systemctl start docker
systemctl enable docker

# Verify installation
docker --version
docker-compose --version
```

#### Step 4: Deploy Application

```bash
# Create directory
mkdir -p /var/www/shopify-upload-api
cd /var/www/shopify-upload-api

# Option A: Clone from git
git clone https://github.com/yourusername/shopify-upload-api.git .

# Option B: Upload from local machine (run from your local terminal)
# scp -r /path/to/shopify-upload-api/* root@YOUR_DROPLET_IP:/var/www/shopify-upload-api/
```

#### Step 5: Configure Environment

```bash
# Create .env file
nano .env
```

Paste your environment variables:
```env
PORT=3000
NODE_ENV=production
SHOPIFY_SHOP=thereadcounts.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-shopify-access-token
SHOPIFY_API_VERSION=2025-10
SHOPIFY_API_SECRET=your-shopify-api-secret
```

Save and exit (Ctrl+X, then Y, then Enter)

#### Step 6: Start Application

```bash
# Build and start containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

#### Step 7: Configure Firewall

```bash
# Allow necessary ports
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw enable

# Check firewall status
ufw status
```

#### Step 8: Test Deployment

```bash
# From the droplet
curl http://localhost:3000/health

# From your local machine
curl http://YOUR_DROPLET_IP/health
```

#### Step 9: (Optional) Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Update nginx config with your domain
nano nginx.conf
# Replace 'server_name _;' with 'server_name api.yourdomain.com;'

# Restart nginx
docker-compose restart nginx

# Get SSL certificate
certbot --nginx -d api.yourdomain.com

# Test auto-renewal
certbot renew --dry-run
```

---

## Frontend Configuration

After deploying your API, update the Shopify theme:

### Step 1: Update Upload Config

Edit the file: `snippets/upload-config.liquid`

Change the `apiUrl` to your production URL:

```javascript
window.SHOPIFY_UPLOAD_CONFIG = {
  // UPDATE THIS URL TO YOUR DEPLOYED API
  apiUrl: 'https://your-app-name.ondigitalocean.app/upload',
  // OR if using custom domain:
  // apiUrl: 'https://api.yourdomain.com/upload',

  maxFileSize: 20 * 1024 * 1024,
  allowedExtensions: ['png', 'jpg', 'jpeg', 'svg', 'gif', 'pdf', 'ai', 'eps'],
  timeout: 30000
};
```

### Step 2: Push Changes to Shopify

```bash
cd "Main:shopify"

# If using Shopify CLI
shopify theme push

# Or commit and use GitHub integration
git add .
git commit -m "Update upload API URL for production"
git push
```

### Step 3: Verify in Theme Editor

1. Go to Shopify Admin > Online Store > Themes
2. Click "Customize" on your live theme
3. Navigate to a product page
4. Check that the upload functionality works

---

## Verification

### Complete System Check

1. **Backend Health Check**
   ```bash
   curl https://your-api-url.com/health
   ```
   ✅ Should return status "ok"

2. **Test Upload via API**
   ```bash
   curl -X POST https://your-api-url.com/upload \
     -F "file=@test-image.png"
   ```
   ✅ Should return success with Shopify CDN URL

3. **Test via Shopify Store**
   - Open a product with custom design enabled
   - Upload a test image
   - Verify image appears in canvas
   - Add to cart
   - Check cart properties contain the Shopify URL

4. **Test Order Properties**
   - Complete a test order
   - Check order details in Shopify Admin
   - Verify "Design Data" property contains:
     - `shopifyUrls`: Array of CDN URLs
     - `preview`: Base64 preview image

---

## Troubleshooting

### API Server Issues

**Problem**: Server won't start

**Solutions**:
```bash
# Check logs
docker-compose logs api

# Verify environment variables
docker-compose exec api printenv | grep SHOPIFY

# Restart services
docker-compose restart
```

---

**Problem**: "Failed to create staged upload" error

**Solutions**:
1. Verify access token has Files read/write permissions
2. Check Shopify app is not uninstalled
3. Verify API version is supported (2025-10)
4. Test access token manually:
   ```bash
   curl -X POST https://thereadcounts.myshopify.com/admin/api/2025-10/graphql.json \
     -H "X-Shopify-Access-Token: YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"query": "{ shop { name } }"}'
   ```

---

**Problem**: CORS errors

**Solutions**:
1. Check the `corsOptions` in `server.js` includes your domain
2. Verify you're using HTTPS in production
3. Update CORS origins:
   ```javascript
   const allowedOrigins = [
     'https://thereadcounts.myshopify.com',
     'https://yourdomain.com',
   ];
   ```
4. Rebuild and restart: `docker-compose up -d --build`

---

### Frontend Issues

**Problem**: "Network error" when uploading

**Solutions**:
1. Check upload URL in `snippets/upload-config.liquid`
2. Verify API is accessible:
   ```bash
   curl https://your-api-url.com/health
   ```
3. Check browser console for CORS errors
4. Verify you're using HTTPS for production URLs

---

**Problem**: File uploads but doesn't appear in canvas

**Solutions**:
1. Check browser console for JavaScript errors
2. Verify Fabric.js is loaded
3. Check image URL is accessible from browser
4. Test image URL directly in browser

---

**Problem**: Design data not in order properties

**Solutions**:
1. Verify hidden input field has data:
   ```javascript
   console.log(document.getElementById('design-data-SECTION_ID').value);
   ```
2. Check form submission includes properties
3. Verify product form ID matches hidden input form attribute

---

### Digital Ocean Issues

**Problem**: App Platform deployment fails

**Solutions**:
1. Check build logs in App Platform dashboard
2. Verify package.json has correct scripts
3. Ensure Node.js version is compatible
4. Check environment variables are set

---

**Problem**: Can't access API from Shopify

**Solutions**:
1. Verify app is running in Digital Ocean dashboard
2. Check firewall rules allow HTTP/HTTPS
3. Test health endpoint from different network
4. Verify DNS is configured correctly for custom domain

---

## Security Best Practices

1. **Use HTTPS in Production**: Always use HTTPS for your API
2. **Rotate Access Tokens**: Periodically rotate Shopify access tokens
3. **Monitor API Usage**: Set up monitoring and alerts
4. **Rate Limiting**: Already configured in nginx (10 req/sec)
5. **File Validation**: API validates file types and sizes
6. **Environment Variables**: Never commit `.env` to version control
7. **CORS Configuration**: Only allow your store domains

---

## Monitoring & Maintenance

### Digital Ocean App Platform

1. Go to your app in Digital Ocean
2. Click "Insights" tab
3. Monitor:
   - Response times
   - Error rates
   - Memory usage
   - Request counts

### Droplet Monitoring

```bash
# View application logs
docker-compose logs -f api

# Check container status
docker-compose ps

# Check resource usage
docker stats

# Check disk space
df -h

# Check memory
free -m
```

### Setup Alerts

In Digital Ocean:
1. Go to Monitoring > Alerts
2. Create alerts for:
   - High CPU usage (>80%)
   - High memory usage (>90%)
   - Disk space low (<10%)
   - API response time (>1000ms)

---

## Cost Summary

### Digital Ocean App Platform
- **Basic**: $5/month (suitable for testing)
- **Professional**: $12/month (recommended for production)
- **Production**: $25/month (high traffic)

### Droplet + Docker
- **Basic**: $6/month (1GB RAM, 1 CPU)
- **Standard**: $12/month (2GB RAM, 1 CPU) ✅ Recommended
- **Performance**: $24/month (4GB RAM, 2 CPUs)

### Additional Costs
- Domain name: ~$12/year (optional)
- SSL Certificate: Free with Let's Encrypt
- Bandwidth: Included in Droplet/App pricing

**Recommended**: Start with App Platform Professional ($12/month) for easiest setup and maintenance.

---

## Next Steps

After completing setup:

1. ✅ Test thoroughly with various file types
2. ✅ Monitor first few days for any issues
3. ✅ Setup backup strategy (Digital Ocean snapshots)
4. ✅ Document your specific configuration
5. ✅ Train staff on new upload functionality
6. ✅ Consider adding features:
   - Multiple file uploads
   - File preview before upload
   - Upload progress bar
   - Drag-and-drop zones

---

## Support & Resources

- [Shopify Admin API Documentation](https://shopify.dev/api/admin)
- [Digital Ocean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Docker Documentation](https://docs.docker.com/)
- [Node.js Documentation](https://nodejs.org/docs/)

---

## Updates & Maintenance

To update your API:

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build

# Or for App Platform, just push to git:
git push
# App Platform will auto-deploy
```

---

**Setup Complete! 🎉**

Your Shopify file upload system is now fully configured and ready for production use.
