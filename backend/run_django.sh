#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
export DJANGO_ENV=production
export DJANGO_DEBUG=False
uv run --active manage.py runserver 0.0.0.0:8001
