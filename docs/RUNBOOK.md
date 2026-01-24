# Runbook - Phase 1

## Prerequisites
- Docker & Docker Compose
- Git

## Setup & Run

1. **Configure Environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env if necessary
   ```

2. **Start Services**
   ```bash
   docker compose up --build -d
   ```

3. **Migrations**
   Migrations run automatically on container startup (see `docker-compose.yml`), but can be run manually:
   ```bash
   docker compose run --rm backend python manage.py migrate
   ```

## Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8001/api/
- **Admin**: http://localhost:8001/admin/
