#!/bin/bash
# HealthApp Deployment Script
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e

ENVIRONMENT=${1:-production}

echo "🚀 HealthApp Deployment Script"
echo "Environment: $ENVIRONMENT"
echo "================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please copy .env.example to .env and configure it first"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest code from Git..."
git pull

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.prod.yml down

# Build images
echo "🏗️  Building Docker images..."
docker compose -f docker-compose.prod.yml build --no-cache

# Start containers
echo "🚀 Starting containers..."
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
docker compose -f docker-compose.prod.yml ps

# Show logs
echo "📋 Recent logs:"
docker compose -f docker-compose.prod.yml logs --tail=50

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Access your app at:"
echo "   Frontend: http://192.168.1.44"
echo "   Backend API: http://192.168.1.44:8000"
echo "   API Docs: http://192.168.1.44:8000/docs"
echo ""
echo "📊 View logs: docker compose -f docker-compose.prod.yml logs -f"
echo "🛑 Stop: docker compose -f docker-compose.prod.yml down"
