#!/bin/bash
set -e

echo "🚀 Starting HealthApp Backend..."

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL..."
while ! pg_isready -h localhost -p 5432 -U healthapp_user > /dev/null 2>&1; do
  sleep 1
done
echo "✅ PostgreSQL is ready"

# Run migrations
echo "🔄 Running database migrations..."
alembic upgrade head

# Seed exercises if needed
echo "🌱 Checking if exercises need seeding..."
python scripts/seed_exercises.py

# Start server
echo "✨ Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
