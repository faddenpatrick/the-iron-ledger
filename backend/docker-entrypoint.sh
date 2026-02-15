#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
until PGPASSWORD=$DATABASE_PASSWORD psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c '\q' 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is up - running migrations..."
alembic upgrade head

echo "Checking if exercises are seeded..."
EXERCISE_COUNT=$(PGPASSWORD=$DATABASE_PASSWORD psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" -t -c "SELECT COUNT(*) FROM exercises WHERE is_custom = false;" 2>/dev/null | xargs)

if [ "$EXERCISE_COUNT" = "0" ]; then
  echo "Seeding exercises..."
  python scripts/seed_exercises.py
else
  echo "Exercises already seeded ($EXERCISE_COUNT found)"
fi

echo "Starting application..."
exec "$@"
