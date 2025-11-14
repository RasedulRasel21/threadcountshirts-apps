# Shopify Upload API

A Node.js API for uploading files to Shopify CDN. This service handles file uploads from your Shopify theme and stores them in Shopify's file storage using the Shopify Admin API.

## Features

- Upload files to Shopify CDN
- Support for multiple file types (PNG, JPG, SVG, PDF, AI, EPS)
- CORS configured for Shopify stores
- Rate limiting and security
- Docker containerization
- Health check endpoint
- Ready for Digital Ocean deployment

## Prerequisites

- Node.js 18+ (for local development)
- Docker and Docker Compose (for containerized deployment)
- Shopify store with a custom app
- Shopify access token with Files read and write permissions

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
NODE_ENV=production
SHOPIFY_SHOP=thereadcounts.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_access_token_here
SHOPIFY_API_VERSION=2025-10
SHOPIFY_API_SECRET=your_api_secret_here
```

## Local Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Test the API

```bash
# Health check
curl http://localhost:3000/health

# Upload a file
curl -X POST http://localhost:3000/upload \
  -F "file=@/path/to/your/image.png"
```

## Docker Deployment

### Build and Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Build Docker Image Only

```bash
docker build -t shopify-upload-api .
docker run -p 3000:3000 --env-file .env shopify-upload-api
```

## Digital Ocean Deployment

### Option 1: Digital Ocean App Platform (Easiest)

1. **Push code to GitHub/GitLab**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Create App on Digital Ocean**
   - Go to [Digital Ocean App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Connect your GitHub/GitLab repository
   - Select the repository and branch

3. **Configure the App**
   - **Name**: shopify-upload-api
   - **Region**: Choose closest to your customers
   - **Environment Variables**: Add all variables from `.env`
     - `PORT=3000`
     - `NODE_ENV=production`
     - `SHOPIFY_SHOP=thereadcounts.myshopify.com`
     - `SHOPIFY_ACCESS_TOKEN=your-shopify-access-token`
     - `SHOPIFY_API_VERSION=2025-10`
     - `SHOPIFY_API_SECRET=your-shopify-api-secret`

4. **Deploy**
   - Click "Create Resources"
   - Wait for deployment to complete
   - Your API will be available at: `https://your-app-name.ondigitalocean.app`

5. **Update Frontend**
   - Update the upload URL in your Shopify theme
   - Change from: `https://thereadcounts-shopify-upload.vercel.app/upload`
   - To: `https://your-app-name.ondigitalocean.app/upload`

### Option 2: Digital Ocean Droplet with Docker

1. **Create a Droplet**
   - Go to Digital Ocean Dashboard
   - Create a new Droplet
   - Choose: Ubuntu 22.04 LTS
   - Plan: Basic ($6/month is sufficient)
   - Add your SSH key

2. **Connect to Droplet**
   ```bash
   ssh root@your_droplet_ip
   ```

3. **Install Docker and Docker Compose**
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
   ```

4. **Setup the Application**
   ```bash
   # Create app directory
   mkdir -p /var/www/shopify-upload-api
   cd /var/www/shopify-upload-api

   # Clone your repository or upload files
   git clone your-repo-url .

   # Or use SCP to upload files
   # From your local machine:
   # scp -r /path/to/shopify-upload-api/* root@your_droplet_ip:/var/www/shopify-upload-api/
   ```

5. **Create .env file**
   ```bash
   nano .env
   ```

   Add your environment variables:
   ```
   PORT=3000
   NODE_ENV=production
   SHOPIFY_SHOP=thereadcounts.myshopify.com
   SHOPIFY_ACCESS_TOKEN=your-shopify-access-token
   SHOPIFY_API_VERSION=2025-10
   SHOPIFY_API_SECRET=your-shopify-api-secret
   ```

6. **Start the Application**
   ```bash
   # Build and start
   docker-compose up -d

   # Check status
   docker-compose ps

   # View logs
   docker-compose logs -f
   ```

7. **Setup Firewall**
   ```bash
   # Allow HTTP, HTTPS, and SSH
   ufw allow 22
   ufw allow 80
   ufw allow 443
   ufw enable
   ```

8. **Setup Domain (Optional but Recommended)**
   - Point your domain to the droplet IP
   - Update nginx.conf with your domain
   - Setup SSL with Let's Encrypt:

   ```bash
   # Install Certbot
   apt install certbot python3-certbot-nginx -y

   # Get SSL certificate
   certbot --nginx -d your-domain.com
   ```

9. **Update Frontend**
   - Update the upload URL in your Shopify theme
   - Change to: `https://your-domain.com/upload`
   - Or use droplet IP: `http://your_droplet_ip/upload`

### Option 3: Digital Ocean Container Registry + Kubernetes

For high-traffic scenarios, consider using Digital Ocean Kubernetes:

1. Push image to DO Container Registry
2. Deploy to DO Kubernetes cluster
3. Setup load balancer and auto-scaling

(Contact for detailed Kubernetes setup if needed)

## API Endpoints

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-14T...",
  "shop": "thereadcounts.myshopify.com",
  "apiVersion": "2025-10"
}
```

### POST /upload
Upload a file to Shopify CDN

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: file (form field)

**Response Success:**
```json
{
  "success": true,
  "url": "https://cdn.shopify.com/...",
  "fileId": "gid://shopify/MediaImage/...",
  "filename": "image.png"
}
```

**Response Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Updating Your Shopify Theme

After deploying the API, update your theme to use the new URL:

1. Open `snippets/product-media-gallery.liquid`
2. Find line ~821 with the upload URL
3. Change from:
   ```javascript
   const uploadUrl = 'https://thereadcounts-shopify-upload.vercel.app/upload';
   ```
4. To your new URL:
   ```javascript
   const uploadUrl = 'https://your-app-name.ondigitalocean.app/upload';
   ```

## Security Considerations

1. **CORS**: Update CORS origins in `server.js` to match your domains
2. **Rate Limiting**: Configured in nginx.conf (10 requests/second)
3. **File Size**: Limited to 20MB per file
4. **File Types**: Only allows images and design files
5. **HTTPS**: Always use HTTPS in production
6. **Environment Variables**: Never commit `.env` to version control

## Monitoring

### Check Application Status
```bash
# Docker logs
docker-compose logs -f api

# Health check
curl http://localhost:3000/health
```

### Digital Ocean Monitoring
- Use Digital Ocean's built-in monitoring
- Setup alerts for CPU, memory, and disk usage
- Monitor API response times

## Troubleshooting

### Application won't start
- Check environment variables are set correctly
- Verify Shopify access token has correct permissions
- Check Docker logs: `docker-compose logs api`

### Upload fails
- Verify Shopify access token is valid
- Check file size is under 20MB
- Verify file type is supported
- Check CORS configuration matches your domain

### CORS errors
- Update `corsOptions` in `server.js` to include your domain
- Rebuild and restart: `docker-compose up -d --build`

## Cost Estimation (Digital Ocean)

### App Platform
- Basic Plan: $5/month
- Professional: $12/month (recommended for production)

### Droplet + Docker
- Basic Droplet: $6/month (1GB RAM, 1 CPU)
- Recommended: $12/month (2GB RAM, 1 CPU)
- + Domain: ~$12/year
- + SSL: Free (Let's Encrypt)

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables
3. Test health endpoint: `/health`
4. Check Shopify API status

## License

MIT
