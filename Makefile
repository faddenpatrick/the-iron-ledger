.PHONY: help build up down restart logs clean deploy

# Default target
help:
	@echo "HealthApp Docker Commands"
	@echo "========================="
	@echo ""
	@echo "Development:"
	@echo "  make build        - Build Docker images"
	@echo "  make up           - Start all services"
	@echo "  make down         - Stop all services"
	@echo "  make restart      - Restart all services"
	@echo "  make logs         - View logs (follow mode)"
	@echo "  make logs-backend - View backend logs only"
	@echo "  make logs-frontend- View frontend logs only"
	@echo "  make ps           - Show running containers"
	@echo ""
	@echo "Database:"
	@echo "  make db-shell     - Open PostgreSQL shell"
	@echo "  make db-backup    - Backup database"
	@echo "  make db-restore   - Restore database"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy       - Full deployment (pull, build, restart)"
	@echo "  make clean        - Remove all containers and volumes"
	@echo ""

# Build images
build:
	docker compose -f docker-compose.prod.yml build

# Start services
up:
	docker compose -f docker-compose.prod.yml up -d
	@echo "✅ Services started!"
	@echo "Frontend: http://192.168.1.44"
	@echo "Backend: http://192.168.1.44:8000"

# Stop services
down:
	docker compose -f docker-compose.prod.yml down

# Restart services
restart: down up

# View logs
logs:
	docker compose -f docker-compose.prod.yml logs -f

logs-backend:
	docker compose -f docker-compose.prod.yml logs -f backend

logs-frontend:
	docker compose -f docker-compose.prod.yml logs -f frontend

logs-db:
	docker compose -f docker-compose.prod.yml logs -f db

# Show running containers
ps:
	docker compose -f docker-compose.prod.yml ps

# Database shell
db-shell:
	docker compose -f docker-compose.prod.yml exec db psql -U healthapp_user -d healthapp

# Database backup
db-backup:
	@echo "Creating backup..."
	@mkdir -p backups
	docker compose -f docker-compose.prod.yml exec -T db pg_dump -U healthapp_user healthapp > backups/healthapp_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup created in backups/"

# Database restore (usage: make db-restore FILE=backups/healthapp_YYYYMMDD_HHMMSS.sql)
db-restore:
	@if [ -z "$(FILE)" ]; then echo "❌ Error: Please specify FILE=path/to/backup.sql"; exit 1; fi
	@echo "Restoring from $(FILE)..."
	docker compose -f docker-compose.prod.yml exec -T db psql -U healthapp_user healthapp < $(FILE)
	@echo "✅ Database restored!"

# Full deployment
deploy:
	@echo "🚀 Starting deployment..."
	git pull
	docker compose -f docker-compose.prod.yml down
	docker compose -f docker-compose.prod.yml build --no-cache
	docker compose -f docker-compose.prod.yml up -d
	@echo "✅ Deployment complete!"

# Clean everything (WARNING: removes volumes!)
clean:
	@echo "⚠️  WARNING: This will remove all containers and volumes!"
	@read -p "Are you sure? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker compose -f docker-compose.prod.yml down -v; \
		echo "✅ Cleaned!"; \
	else \
		echo "❌ Cancelled"; \
	fi
