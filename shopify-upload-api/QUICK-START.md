# Quick Start Guide

Get your Shopify file upload system running in minutes!

## Local Testing (5 minutes)

### 1. Install and Start

```bash
cd shopify-upload-api
npm install
docker-compose up -d
```

### 2. Test API

```bash
curl http://localhost:3000/health
```

### 3. Test Shopify Store

Your theme is already configured for local testing. Just open your store:

```bash
cd "Main:shopify"
shopify theme dev
```

Navigate to a product page and try uploading a file!

---

## Production Deployment (15 minutes)

### Option 1: Digital Ocean App Platform (Easiest)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. **Create App on Digital Ocean**
   - Go to: https://cloud.digitalocean.com/apps
   - Click "Create App" → Choose GitHub
   - Select repository → Choose branch
   - Add environment variables from `.env` file
   - Click "Create Resources"

3. **Update Shopify Theme**

   Edit `snippets/upload-config.liquid`:
   ```javascript
   apiUrl: 'https://your-app-name.ondigitalocean.app/upload',
   ```

4. **Deploy Theme**
   ```bash
   cd "Main:shopify"
   shopify theme push
   ```

**Done! 🎉**

---

### Option 2: Digital Ocean Droplet

1. **Create Droplet**
   - Ubuntu 22.04, Basic $12/month
   - Add SSH key

2. **SSH and Install Docker**
   ```bash
   ssh root@YOUR_IP
   curl -fsSL https://get.docker.com | sh
   apt install docker-compose -y
   ```

3. **Upload and Deploy**
   ```bash
   mkdir -p /var/www/shopify-upload-api
   cd /var/www/shopify-upload-api
   # Upload files or git clone
   docker-compose up -d
   ```

4. **Configure Firewall**
   ```bash
   ufw allow 22
   ufw allow 80
   ufw allow 443
   ufw enable
   ```

5. **Update Shopify Theme** (same as above)

**Done! 🎉**

---

## Configuration Summary

### Backend (.env)
```env
PORT=3000
NODE_ENV=production
SHOPIFY_SHOP=thereadcounts.myshopify.com
SHOPIFY_ACCESS_TOKEN=your-shopify-access-token
SHOPIFY_API_VERSION=2025-10
```

### Frontend (snippets/upload-config.liquid)
```javascript
apiUrl: 'YOUR_API_URL/upload'
```

---

## Testing Checklist

- [ ] Health check returns "ok"
- [ ] File upload returns Shopify CDN URL
- [ ] Upload works from Shopify store
- [ ] Design appears in canvas
- [ ] Order properties contain file URL
- [ ] No CORS errors in browser console

---

## Need Help?

- **Full Documentation**: See `SETUP-GUIDE.md`
- **API Reference**: See `README.md`
- **Logs**: `docker-compose logs -f`
- **Health Check**: `curl YOUR_URL/health`

---

## URLs You Need

| Environment | API URL | Config File |
|-------------|---------|-------------|
| **Local** | `http://localhost:3000/upload` | Already set ✅ |
| **Production** | `https://your-app.ondigitalocean.app/upload` | Update needed |
| **Custom Domain** | `https://api.yourdomain.com/upload` | Update needed |

Update the URL in: `snippets/upload-config.liquid`

---

## Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Test upload
./test-upload.sh

# Deploy
./deploy.sh
```

---

**That's it! Your upload system is ready to go! 🚀**
