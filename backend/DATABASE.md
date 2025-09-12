# Database Setup Guide

This guide explains how to set up the PostgreSQL database for the Vibe Coding Notes backend.

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm installed

## Quick Start with Docker

1. **Start the database services:**

   ```bash
   docker-compose up -d
   ```

2. **Generate Prisma client:**

   ```bash
   npm run db:generate
   ```

3. **Run database migrations:**

   ```bash
   npm run db:migrate
   ```

4. **Seed the database with initial data:**
   ```bash
   npm run db:seed
   ```

## Manual PostgreSQL Setup

If you prefer to use an existing PostgreSQL installation:

1. **Create the database:**

   ```sql
   CREATE DATABASE vibe_coding_notes;
   CREATE USER username WITH PASSWORD 'password';
   GRANT ALL PRIVILEGES ON DATABASE vibe_coding_notes TO username;
   ```

2. **Update the DATABASE_URL in .env:**

   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/vibe_coding_notes"
   ```

3. **Follow steps 2-4 from the Docker setup above**

## Database Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:migrate:deploy` - Deploy migrations (production)
- `npm run db:push` - Push schema changes without migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:reset` - Reset database and run migrations + seed

## Database Schema

The database includes the following models:

### User

- Stores user information and authentication details
- Supports multiple auth providers (email, OAuth)
- Role-based access (OWNER, VISITOR)

### Note

- Main content entity for coding tool notes
- Belongs to a user (author) and category
- Has many-to-many relationship with tags
- Tracks like count and publication status

### Comment

- User comments on notes
- Supports nested comments (replies)
- Can be moderated by note owner

### Category

- Organizes notes by tool categories
- Has unique slug for URL-friendly access

### Tag

- Many-to-many tagging system for notes
- Helps with content discovery and filtering

### Like

- Anonymous likes tracked by IP address
- Prevents duplicate likes from same IP

## Seeded Data

The seed script creates:

- 5 default categories (Frontend, Backend, Databases, DevOps, Development Tools)
- 20 common tags
- 1 owner user (owner@vibecoding.com)
- 1 sample visitor user
- 2 sample notes with tags and comments

## Environment Variables

Required database environment variables:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/vibe_coding_notes"
REDIS_URL="redis://localhost:6379"
```

## Troubleshooting

### Connection Issues

- Ensure PostgreSQL is running on port 5432
- Check username/password in DATABASE_URL
- Verify database exists

### Migration Issues

- Run `npm run db:reset` to start fresh
- Check Prisma schema syntax
- Ensure database user has proper permissions

### Docker Issues

- Run `docker-compose down -v` to remove volumes
- Check if ports 5432 and 6379 are available
- Review Docker logs: `docker-compose logs`
