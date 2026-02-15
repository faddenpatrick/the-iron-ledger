# Deployment Guide for 192.168.1.44

This guide covers deploying HealthApp to your server at patrick@192.168.1.44.

## Step 1: Transfer Files to Server

From your local machine:

```bash
# Navigate to project directory
cd /Users/patrickfadden/Documents/Projects

# Transfer files using rsync (recommended)
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '__pycache__' \
  --exclude '.git' \
  --exclude 'venv' \
  --exclude '*.pyc' \
  --exclude '.env' \
  HealthApp/ patrick@192.168.1.44:~/HealthApp/
```

## Step 2: SSH into Server

```bash
ssh patrick@192.168.1.44
```

## Step 3: Initial Server Setup

```bash
cd ~/HealthApp

# Install Docker if not already installed
sudo apt update
sudo apt install -y docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker patrick
# Logout and login again for group change to take effect

# Install PostgreSQL client tools (for pg_isready)
sudo apt install -y postgresql-client

# Install Python and pip
sudo apt install -y python3 python3-pip python3-venv

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

## Step 4: Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit .env file
nano .env
```

Update these values:
```bash
# Generate a strong SECRET_KEY (run: python3 -c "import secrets; print(secrets.token_urlsafe(32))")
SECRET_KEY=your-generated-secret-key-here

# Database URL (keep as is if using Docker)
DATABASE_URL=postgresql://healthapp_user:healthapp_pass@localhost:5432/healthapp

# CORS Origins (add your server IPs/domains)
CORS_ORIGINS=["http://192.168.1.44:5173", "http://localhost:5173"]
```

Frontend .env:
```bash
cd frontend
cp .env.example .env
echo "VITE_API_URL=http://192.168.1.44:8000" > .env
cd ..
```

## Step 5: Start PostgreSQL

```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Wait for it to be healthy
docker-compose ps

# Verify it's running
docker logs healthapp_db
```

## Step 6: Set Up Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed exercises
python scripts/seed_exercises.py

# Test that it works
python -c "from app.database import engine; print('Database connection successful!')"
```

## Step 7: Start Backend (Using screen or tmux)

### Option A: Using screen (recommended for beginners)

```bash
# Install screen if not available
sudo apt install -y screen

# Start new screen session for backend
screen -S healthapp-backend

# In screen session
cd ~/HealthApp/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Detach from screen: Press Ctrl+A, then D
# Reattach later: screen -r healthapp-backend
```

### Option B: Using systemd service (recommended for production)

Create service file:
```bash
sudo nano /etc/systemd/system/healthapp-backend.service
```

Add this content:
```ini
[Unit]
Description=HealthApp Backend API
After=network.target docker.service

[Service]
Type=simple
User=patrick
WorkingDirectory=/home/patrick/HealthApp/backend
Environment="PATH=/home/patrick/HealthApp/backend/venv/bin"
ExecStart=/home/patrick/HealthApp/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable healthapp-backend
sudo systemctl start healthapp-backend
sudo systemctl status healthapp-backend
```

View logs:
```bash
sudo journalctl -u healthapp-backend -f
```

## Step 8: Set Up Frontend

```bash
cd ~/HealthApp/frontend

# Install dependencies
npm install

# Build for production
npm run build

# Preview the build
npm run preview -- --host 0.0.0.0 --port 5173
```

Or run in screen:
```bash
screen -S healthapp-frontend
cd ~/HealthApp/frontend
npm run preview -- --host 0.0.0.0 --port 5173
# Detach: Ctrl+A, then D
```

## Step 9: Verify Deployment

### Check Backend API

```bash
# From server
curl http://localhost:8000/health

# Test authentication
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# View API docs
# Open browser to: http://192.168.1.44:8000/docs
```

### Check Frontend

Open browser to: `http://192.168.1.44:5173`

You should see the login page.

### Test Complete Flow

1. Register a new account
2. Login
3. Navigate to different pages using bottom navigation
4. Check that API calls work (open browser DevTools → Network tab)

## Step 10: Access via Tailscale

If you have Tailscale configured on the server:

1. Find Tailscale IP:
```bash
tailscale ip -4
```

2. Access application:
- Backend: `http://[tailscale-ip]:8000`
- Frontend: `http://[tailscale-ip]:5173`

3. Update CORS origins in backend `.env` to include Tailscale IP:
```bash
CORS_ORIGINS=["http://192.168.1.44:5173", "http://[tailscale-ip]:5173"]
```

## Maintenance Commands

### View Logs

Backend (if using systemd):
```bash
sudo journalctl -u healthapp-backend -f
```

Backend (if using screen):
```bash
screen -r healthapp-backend
```

PostgreSQL:
```bash
docker logs -f healthapp_db
```

### Restart Services

```bash
# PostgreSQL
docker-compose restart postgres

# Backend (systemd)
sudo systemctl restart healthapp-backend

# Backend (screen) - reattach and press Ctrl+C, then restart
```

### Database Backups

```bash
# Create backup
docker exec healthapp_db pg_dump -U healthapp_user healthapp > backup_$(date +%Y%m%d).sql

# Restore from backup
docker exec -i healthapp_db psql -U healthapp_user healthapp < backup_20240214.sql
```

### Update Code

```bash
# On local machine, transfer updated files
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '__pycache__' \
  --exclude '.git' \
  --exclude 'venv' \
  HealthApp/ patrick@192.168.1.44:~/HealthApp/

# On server
cd ~/HealthApp/backend
source venv/bin/activate
alembic upgrade head  # Run any new migrations

sudo systemctl restart healthapp-backend

cd ~/HealthApp/frontend
npm install  # If package.json changed
npm run build
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 8000
sudo lsof -i :8000

# Kill process if needed
sudo kill -9 [PID]
```

### PostgreSQL Won't Start

```bash
# Check logs
docker logs healthapp_db

# Remove and recreate
docker-compose down -v
docker-compose up -d postgres
```

### Frontend Can't Connect to Backend

1. Check CORS origins in backend `.env`
2. Check `VITE_API_URL` in frontend `.env`
3. Verify backend is running: `curl http://localhost:8000/health`
4. Check firewall rules: `sudo ufw status`

## Security Notes

1. **Change SECRET_KEY** in production - generate a strong random key
2. **Use HTTPS** when exposing publicly (add in Phase 9 with Nginx)
3. **Firewall**: Only expose necessary ports via Tailscale
4. **Database**: Use strong password for PostgreSQL
5. **Backups**: Set up automated database backups

## Next Steps

Once basic deployment works:

1. Complete Phases 5-8 (UI implementation)
2. Add Nginx reverse proxy (Phase 9)
3. Set up SSL/TLS certificates
4. Configure automated backups
5. Add monitoring and logging
