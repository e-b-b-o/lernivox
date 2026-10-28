# Lernivox Local Infrastructure

This directory contains Docker Compose infrastructure for local development.

## Services Included

1. **PostgreSQL 16 with `pgvector`**
   - Image: `pgvector/pgvector:pg16`
   - Default Port: `5433` (mapped from container `5432` to avoid host port collisions)
   - Persistent Volume: `lernivox_pgdata`
   - Database Name: `lernivox`
   - User: `lernivox`

2. **Redis 7**
   - Image: `redis:7-alpine`
   - Default Port: `6379`
   - Persistent Volume: `lernivox_redisdata`
   - Used by: `@nestjs/bullmq` background worker for job queues

## Commands

```bash
# Start infrastructure in the background
docker compose -f infra/docker/docker-compose.yml up -d

# Check health and status
docker compose -f infra/docker/docker-compose.yml ps

# View service logs
docker compose -f infra/docker/docker-compose.yml logs -f

# Stop infrastructure
docker compose -f infra/docker/docker-compose.yml down

# Stop infrastructure and remove persistent volumes (destructive)
docker compose -f infra/docker/docker-compose.yml down -v
```

## Connecting from Applications

- **DATABASE_URL**: `postgresql://lernivox:lernivox_dev_password@localhost:5433/lernivox?schema=public`
- **REDIS_HOST**: `localhost`
- **REDIS_PORT**: `6379`
