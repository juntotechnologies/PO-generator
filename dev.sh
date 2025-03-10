#!/bin/bash

# PO Generator Development Script
# This script runs the application in development mode

set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting PO Generator in development mode..."

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "uv is not installed. Please install uv and try again."
    echo "You can install it using: pip install uv"
    exit 1
fi

# Make sure Python 3.11 is installed via uv
echo "Checking for Python 3.11..."
if ! uv python list | grep -q "3.11"; then
    echo "Installing Python 3.11 via uv..."
    uv python install 3.11
fi

# Navigate to the project directory
PROJECT_DIR=$(dirname "$0")
cd "$PROJECT_DIR"
PROJECT_DIR=$(pwd)  # Get absolute path

# Check if PostgreSQL database exists
check_database() {
    if ! command -v psql &> /dev/null; then
        echo "PostgreSQL client (psql) is not installed. Please install it and try again."
        exit 1
    fi
    
    # Get database connection details from environment or use defaults
    PG_USER=${DB_USER:-postgres}
    PG_PASSWORD=${DB_PASSWORD:-postgres}
    PG_HOST=${DB_HOST:-localhost}
    PG_PORT=${DB_PORT:-5432}
    
    # Check if development database exists
    if ! PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -lqt | cut -d \| -f 1 | grep -qw "po_generator_development"; then
        echo "Development database 'po_generator_development' does not exist."
        echo "Creating database..."
        PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -c "CREATE DATABASE po_generator_development;" postgres
        
        if [ $? -ne 0 ]; then
            echo "Failed to create database. Please run ./backend/manage_db.sh and select option 5 to create databases."
            exit 1
        fi
    fi
}

# Backend setup
echo "Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment with Python 3.11..."
    uv venv --python 3.11 venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/.dependencies_installed" ]; then
    echo "Installing dependencies..."
    uv pip install -r requirements.txt
    touch venv/.dependencies_installed
fi

# Check if development database exists
check_database

# Run migrations for development database
echo "Running migrations for development database..."
DJANGO_ENV=development uv run --python 3.11 manage.py migrate

# Start Django development server in the background
echo "Starting Django development server..."
DJANGO_ENV=development DJANGO_DEBUG=True uv run --python 3.11 manage.py runserver 0.0.0.0:8001 &
DJANGO_PID=$!

# Deactivate virtual environment
deactivate

# Frontend setup
echo "Setting up frontend..."
cd ../frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start React development server
echo "Starting React development server..."
PORT=3000 npm start &
REACT_PID=$!

# Display information
echo ""
echo "Development servers started:"
echo "Backend running at: http://localhost:8001"
echo "Frontend running at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to press Ctrl+C
trap "kill $DJANGO_PID $REACT_PID; exit" INT
wait 