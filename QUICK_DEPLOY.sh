#!/bin/bash
# Quick deployment script for HealthApp
# Run this on the server after transferring files

set -e

echo "🏥 HealthApp Quick Deployment Script"
echo "===================================="
echo ""

# Check if running from correct directory
if [ ! -f "README.md" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Must run from HealthApp root directory"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check dependencies
echo "📋 Checking dependencies..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Install with: sudo apt install -y docker.io docker-compose${NC}"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 not found. Install with: sudo apt install -y python3 python3-pip python3-venv${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Node.js/npm not found. Install with: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All dependencies found${NC}"
echo ""

# Step 2: Configure environment
echo "⚙️  Configuring environment..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Created .env from template. EDIT IT NOW:${NC}"
    echo "   1. Generate SECRET_KEY: python3 -c \"import secrets; print(secrets.token_urlsafe(32))\""
    echo "   2. Update CORS_ORIGINS with your server IP"
    echo "   3. Then run this script again"
    exit 0
fi

if [ ! -f "frontend/.env" ]; then
    cd frontend
    echo "VITE_API_URL=http://$(hostname -I | awk '{print $1}'):8000" > .env
    cd ..
    echo -e "${GREEN}✅ Created frontend/.env${NC}"
fi

echo ""

# Step 3: Start PostgreSQL
echo "🐘 Starting PostgreSQL..."
docker-compose up -d postgres

echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U healthapp_user &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ PostgreSQL failed to start${NC}"
        exit 1
    fi
    sleep 1
done

echo ""

# Step 4: Set up backend
echo "🔧 Setting up backend..."

cd backend

if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "Installing Python dependencies..."
pip install -q -r requirements.txt

echo "Running database migrations..."
alembic upgrade head

echo "Seeding exercises..."
python scripts/seed_exercises.py

echo -e "${GREEN}✅ Backend setup complete${NC}"
echo ""

# Step 5: Set up frontend
echo "🎨 Setting up frontend..."

cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

echo "Building frontend..."
npm run build

echo -e "${GREEN}✅ Frontend setup complete${NC}"
echo ""

# Step 6: Instructions for running
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "To start the application:"
echo ""
echo "Backend (in screen or tmux):"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo ""
echo "Frontend (in another screen/tmux):"
echo "  cd frontend"
echo "  npm run preview -- --host 0.0.0.0 --port 5173"
echo ""
echo "Or use systemd services (see DEPLOYMENT.md for setup)"
echo ""
echo "Access points:"
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "  🌐 Frontend: http://${SERVER_IP}:5173"
echo "  🔌 Backend API: http://${SERVER_IP}:8000"
echo "  📚 API Docs: http://${SERVER_IP}:8000/docs"
echo ""
echo "For detailed instructions, see DEPLOYMENT.md"
