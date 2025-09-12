# Docker Deployment Guide

This guide covers how to deploy Vibe Coding Notes using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available
- At least 5GB disk space

## Quick Start

### Development Environment

1. **Clone the repository and navigate to the project root**

2. **Copy environment file**

   ```bash
   cp .env.example .env
   ```

3. **Update environment variables**
   Edit `.env` file with your configuration:

   - Database credentials
   - JWT secrets
   - OAuth provider credentials
   - API URLs

4. **Start development environment**

   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

5. **Run database migrations**

   ```bash
   docker-compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy
   docker-compose -f docker-compose.dev.yml exec backend npx prisma db seed
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Database: localhost:5432

### Production Environment

1. **Copy production environment file**

   ```bash
   cp .env.production .env
   ```

2. **Update production environment variables**
   Edit `.env` file with your production configuration:

   - **IMPORTANT**: Change all default passwords and secrets
   - Set your production domain URLs
   - Configure OAuth providers for production

3. **Start production environment**

   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**

   ```bash
   docker-compose exec backend npx prisma migrate deploy
   docker-compose exec backend npx prisma db seed
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Environment Configuration

### Required Environment Variables

| Variable            | Description        | Example                       |
| ------------------- | ------------------ | ----------------------------- |
| `NODE_ENV`          | Environment mode   | `production`                  |
| `POSTGRES_DB`       | Database name      | `vibe_coding_notes`           |
| `POSTGRES_USER`     | Database user      | `vibe_user`                   |
| `POSTGRES_PASSWORD` | Database password  | `secure_password`             |
| `JWT_SECRET`        | JWT signing secret | `your-jwt-secret`             |
| `SESSION_SECRET`    | Session secret     | `your-session-secret`         |
| `FRONTEND_URL`      | Frontend URL       | `https://your-domain.com`     |
| `VITE_API_URL`      | Backend API URL    | `https://api.your-domain.com` |

### OAuth Configuration

Configure OAuth providers by setting their respective client IDs and secrets:

- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- GitHub: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- Facebook: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
- Apple: `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY_PATH`
- Naver: `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`
- Kakao: `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`

## Services

### PostgreSQL Database

- **Image**: `postgres:15-alpine`
- **Port**: 5432
- **Volume**: `postgres_data`
- **Health Check**: Built-in pg_isready check

### Redis Cache

- **Image**: `redis:7-alpine`
- **Port**: 6379
- **Volume**: `redis_data`
- **Health Check**: Redis ping command

### Backend API

- **Build**: Custom Node.js application
- **Port**: 3001
- **Health Check**: `/health` endpoint
- **Dependencies**: PostgreSQL, Redis

### Frontend

- **Build**: React app served by Nginx
- **Port**: 80 (production) / 5173 (development)
- **Health Check**: Nginx health endpoint

## Health Checks

All services include health checks:

- **Database**: `pg_isready` command
- **Redis**: `redis-cli ping` command
- **Backend**: HTTP GET to `/health` endpoint
- **Frontend**: HTTP GET to `/health` endpoint

Check service health:

```bash
docker-compose ps
```

## Useful Commands

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Execute commands in containers

```bash
# Backend shell
docker-compose exec backend sh

# Database shell
docker-compose exec postgres psql -U username -d vibe_coding_notes

# Redis CLI
docker-compose exec redis redis-cli
```

### Database operations

```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database
docker-compose exec backend npx prisma db seed

# Reset database
docker-compose exec backend npx prisma migrate reset

# Open Prisma Studio
docker-compose exec backend npx prisma studio
```

### Backup and restore

```bash
# Backup database
docker-compose exec postgres pg_dump -U username vibe_coding_notes > backup.sql

# Restore database
docker-compose exec -T postgres psql -U username vibe_coding_notes < backup.sql
```

## Scaling

### Horizontal scaling

```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Scale with load balancer (requires additional configuration)
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d
```

## Monitoring

### Resource usage

```bash
# Container stats
docker stats

# Service resource usage
docker-compose top
```

### Health monitoring

```bash
# Check all health statuses
curl http://localhost:3001/health
curl http://localhost:3001/health/db
curl http://localhost:3000/health
```

## Troubleshooting

### Common issues

1. **Port conflicts**

   - Change port mappings in docker-compose.yml
   - Check for services running on required ports

2. **Database connection issues**

   - Verify DATABASE_URL format
   - Check database service health
   - Ensure migrations are run

3. **OAuth authentication issues**

   - Verify OAuth provider configuration
   - Check redirect URLs match your domain
   - Ensure environment variables are set

4. **Build failures**
   - Clear Docker cache: `docker system prune -a`
   - Rebuild without cache: `docker-compose build --no-cache`

### Debug mode

Run services in debug mode:

```bash
# Development with debug logs
NODE_ENV=development docker-compose -f docker-compose.dev.yml up

# Production with verbose logging
docker-compose up --verbose
```

## Security Considerations

### Production Security Checklist

- [ ] Change all default passwords and secrets
- [ ] Use strong, unique passwords for database
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Enable Docker security scanning
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity

### Network Security

The application uses a custom Docker network (`app-network`) to isolate services. Only necessary ports are exposed to the host.

## Performance Optimization

### Resource Limits

Add resource limits to docker-compose.yml:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M
```

### Caching

- Redis is configured for session storage and API caching
- Nginx serves static files with appropriate cache headers
- Database queries are optimized with proper indexing

## Maintenance

### Regular maintenance tasks

1. **Update images**

   ```bash
   docker-compose pull
   docker-compose up -d
   ```

2. **Clean up unused resources**

   ```bash
   docker system prune -f
   docker volume prune -f
   ```

3. **Backup data**

   - Database backups (automated recommended)
   - Volume backups for persistent data

4. **Monitor logs**
   - Set up log rotation
   - Monitor for errors and performance issues

## Support

For issues related to Docker deployment:

1. Check the troubleshooting section above
2. Review Docker and application logs
3. Verify environment configuration
4. Check service health endpoints
