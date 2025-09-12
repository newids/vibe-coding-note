# Vibe Coding Notes - Docker Management

.PHONY: help build up down logs clean dev prod migrate seed backup restore health

# Default target
help: ## Show this help message
	@echo "Vibe Coding Notes - Docker Management"
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development commands
dev: ## Start development environment
	@echo "🚀 Starting development environment..."
	@docker-compose -f docker-compose.dev.yml up -d
	@echo "✅ Development environment started"
	@echo "📍 Frontend: http://localhost:5173"
	@echo "📍 Backend: http://localhost:3001"
	@echo "📍 Database: localhost:5432"

dev-build: ## Build and start development environment
	@echo "🔨 Building development environment..."
	@docker-compose -f docker-compose.dev.yml up -d --build
	@echo "✅ Development environment built and started"

dev-down: ## Stop development environment
	@echo "🛑 Stopping development environment..."
	@docker-compose -f docker-compose.dev.yml down
	@echo "✅ Development environment stopped"

dev-logs: ## Show development logs
	@docker-compose -f docker-compose.dev.yml logs -f

# Production commands
prod: ## Start production environment
	@echo "🚀 Starting production environment..."
	@docker-compose up -d
	@echo "✅ Production environment started"
	@echo "📍 Frontend: http://localhost:3000"
	@echo "📍 Backend: http://localhost:3001"

prod-build: ## Build and start production environment
	@echo "🔨 Building production environment..."
	@docker-compose up -d --build
	@echo "✅ Production environment built and started"

prod-down: ## Stop production environment
	@echo "🛑 Stopping production environment..."
	@docker-compose down
	@echo "✅ Production environment stopped"

prod-logs: ## Show production logs
	@docker-compose logs -f

# Database commands
migrate: ## Run database migrations
	@echo "🗄️  Running database migrations..."
	@docker-compose exec backend npx prisma migrate deploy
	@echo "✅ Database migrations completed"

migrate-dev: ## Run database migrations (development)
	@echo "🗄️  Running database migrations (development)..."
	@docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy
	@echo "✅ Database migrations completed"

seed: ## Seed database with initial data
	@echo "🌱 Seeding database..."
	@docker-compose exec backend npx prisma db seed
	@echo "✅ Database seeded"

seed-dev: ## Seed database with initial data (development)
	@echo "🌱 Seeding database (development)..."
	@docker-compose -f docker-compose.dev.yml exec backend npx prisma db seed
	@echo "✅ Database seeded"

db-reset: ## Reset database (WARNING: This will delete all data)
	@echo "⚠️  WARNING: This will delete all data!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ]
	@docker-compose exec backend npx prisma migrate reset --force
	@echo "✅ Database reset completed"

db-studio: ## Open Prisma Studio
	@echo "🎨 Opening Prisma Studio..."
	@docker-compose exec backend npx prisma studio

# Backup and restore
backup: ## Backup database
	@echo "💾 Creating database backup..."
	@mkdir -p backups
	@docker-compose exec postgres pg_dump -U username vibe_coding_notes > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backup created in backups/"

restore: ## Restore database from backup (specify BACKUP_FILE=filename)
	@echo "📥 Restoring database from backup..."
	@if [ -z "$(BACKUP_FILE)" ]; then echo "❌ Please specify BACKUP_FILE=filename"; exit 1; fi
	@docker-compose exec -T postgres psql -U username vibe_coding_notes < $(BACKUP_FILE)
	@echo "✅ Database restored from $(BACKUP_FILE)"

# Health and monitoring
health: ## Check service health
	@echo "🏥 Checking service health..."
	@echo "Backend API:"
	@curl -s http://localhost:3001/health | jq . || echo "❌ Backend not responding"
	@echo "Database:"
	@curl -s http://localhost:3001/health/db | jq . || echo "❌ Database not responding"
	@echo "Frontend:"
	@curl -s http://localhost:3000/health || echo "❌ Frontend not responding"
	@echo "Docker services:"
	@docker-compose ps

health-dev: ## Check development service health
	@echo "🏥 Checking development service health..."
	@echo "Backend API:"
	@curl -s http://localhost:3001/health | jq . || echo "❌ Backend not responding"
	@echo "Database:"
	@curl -s http://localhost:3001/health/db | jq . || echo "❌ Database not responding"
	@echo "Frontend:"
	@curl -s http://localhost:5173/health || echo "❌ Frontend not responding"
	@echo "Docker services:"
	@docker-compose -f docker-compose.dev.yml ps

logs: ## Show all service logs
	@docker-compose logs -f

logs-backend: ## Show backend logs
	@docker-compose logs -f backend

logs-frontend: ## Show frontend logs
	@docker-compose logs -f frontend

logs-db: ## Show database logs
	@docker-compose logs -f postgres

logs-redis: ## Show Redis logs
	@docker-compose logs -f redis

# Build commands
build: ## Build all services
	@echo "🔨 Building all services..."
	@docker-compose build
	@echo "✅ All services built"

build-backend: ## Build backend service
	@echo "🔨 Building backend service..."
	@docker-compose build backend
	@echo "✅ Backend service built"

build-frontend: ## Build frontend service
	@echo "🔨 Building frontend service..."
	@docker-compose build frontend
	@echo "✅ Frontend service built"

# Utility commands
shell-backend: ## Open backend container shell
	@docker-compose exec backend sh

shell-db: ## Open database shell
	@docker-compose exec postgres psql -U username -d vibe_coding_notes

shell-redis: ## Open Redis CLI
	@docker-compose exec redis redis-cli

clean: ## Clean up Docker resources
	@echo "🧹 Cleaning up Docker resources..."
	@docker-compose down -v --remove-orphans
	@docker system prune -f
	@docker volume prune -f
	@echo "✅ Docker resources cleaned"

clean-all: ## Clean up all Docker resources (including images)
	@echo "🧹 Cleaning up all Docker resources..."
	@docker-compose down -v --remove-orphans
	@docker system prune -a -f
	@docker volume prune -f
	@echo "✅ All Docker resources cleaned"

# Environment setup
setup-env: ## Copy environment file
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ Environment file created (.env)"; \
		echo "📝 Please edit .env with your configuration"; \
	else \
		echo "⚠️  Environment file already exists"; \
	fi

setup-prod-env: ## Copy production environment file
	@if [ ! -f .env ]; then \
		cp .env.production .env; \
		echo "✅ Production environment file created (.env)"; \
		echo "📝 Please edit .env with your production configuration"; \
	else \
		echo "⚠️  Environment file already exists"; \
	fi

# Quick setup commands
setup-dev: setup-env dev-build migrate-dev seed-dev ## Complete development setup
	@echo "🎉 Development environment is ready!"
	@echo "📍 Frontend: http://localhost:5173"
	@echo "📍 Backend: http://localhost:3001"

setup-prod: setup-prod-env prod-build migrate seed ## Complete production setup
	@echo "🎉 Production environment is ready!"
	@echo "📍 Frontend: http://localhost:3000"
	@echo "📍 Backend: http://localhost:3001"
	@echo "⚠️  Don't forget to configure your reverse proxy and SSL certificates!"

# Status and monitoring
status: ## Show service status
	@echo "📊 Service Status:"
	@docker-compose ps

stats: ## Show resource usage
	@echo "📈 Resource Usage:"
	@docker stats --no-stream

# Update commands
update: ## Update and restart services
	@echo "🔄 Updating services..."
	@docker-compose pull
	@docker-compose up -d
	@echo "✅ Services updated"

# Testing commands
test-backend: ## Run backend tests
	@echo "🧪 Running backend tests..."
	@docker-compose exec backend npm test

test-frontend: ## Run frontend tests
	@echo "🧪 Running frontend tests..."
	@docker-compose exec frontend npm test