# Environment Variables

## Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DJANGO_SECRET_KEY` | Secret key for Django | `change-me` |
| `DJANGO_DEBUG` | Debug mode (1=True, 0=False) | `0` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowlist | `localhost,127.0.0.1,backend` |
| `DATABASE_URL` | Check standard format | `postgresql://accred:accred@postgres:5432/accred` |
| `CORS_ALLOWED_ORIGINS` | Frontend URL for CORS | `http://localhost:5173` |
| `MEDIA_ROOT` | Path to media files | `/app/media` |

## Frontend (`frontend/.env` or build time)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE` | URL of the backend API | `http://localhost:8001` |
