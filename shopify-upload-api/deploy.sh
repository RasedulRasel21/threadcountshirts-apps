#!/bin/bash

# Deployment script for Shopify Upload API

set -e

echo "🚀 Starting deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file from .env.example"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed!"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed!"
    echo "Please install Docker Compose first"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build new images
echo "🔨 Building Docker images..."
docker-compose build --no-cache

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo "🏥 Checking health..."
HEALTH_CHECK=$(curl -s http://localhost:3000/health || echo "failed")

if [[ $HEALTH_CHECK == *"ok"* ]]; then
    echo "✅ Deployment successful!"
    echo "📊 API is running at: http://localhost:3000"
    echo "🏥 Health check: http://localhost:3000/health"
    echo ""
    echo "To view logs, run: docker-compose logs -f"
else
    echo "❌ Health check failed!"
    echo "Check logs with: docker-compose logs"
    exit 1
fi
