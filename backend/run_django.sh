#!/bin/bash
cd "$(dirname "$0")"
source .venv/bin/activate
export DJANGO_DEBUG=True
uv run --python 3.11 manage.py runserver 0.0.0.0:8000 