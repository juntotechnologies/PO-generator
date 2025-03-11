#!/bin/bash
cd "$(dirname "$0")"
source "../.venv/bin/activate"

# Get environment from command line argument, default to production if not provided
ENV=${1:-production}

if [ "$ENV" = "development" ] || [ "$ENV" = "dev" ]; then
  export DJANGO_ENV=development
  export ENVIRONMENT=development
  export DJANGO_DEBUG=True
  PORT=${DEV_BACKEND_PORT:-8000}
else
  export DJANGO_ENV=production
  export ENVIRONMENT=production
  export DJANGO_DEBUG=False
  PORT=${PROD_BACKEND_PORT:-8001}
fi

uv run --active manage.py runserver 0.0.0.0:${PORT}
