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

# Load environment variables
if [ -f ".env" ]; then
    source .env
fi

# Set default port values if not defined in .env
DEV_BACKEND_PORT=${DEV_BACKEND_PORT:-8000}
DEV_FRONTEND_PORT=${DEV_FRONTEND_PORT:-3000}

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
        if [ $? -ne 0 ]; then
            echo "Please run ./backend/manage_db.sh and select option 5 to create databases."
            exit 1
        fi
    fi
}

# Backend setup
echo "Setting up backend..."
cd backend

# Remove existing virtual environment if it exists
if [ -d "venv" ]; then
    echo "Removing existing virtual environment..."
    rm -rf venv
    rm -f venv/.dependencies_installed
fi

# Create a new virtual environment with Python 3.11
echo "Creating virtual environment with Python 3.11..."
uv venv --python 3.11 venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
# Try installing dependencies
if ! uv pip install -r requirements.txt; then
    echo "Error: Failed to install dependencies."
    echo "Trying alternative approach for Pillow..."
    
    # Try installing Pillow separately first with a newer version
    if ! uv pip install pillow==10.2.0; then
        echo "Error: Failed to install Pillow. Trying with system packages..."
        
        # On macOS, try installing with Homebrew dependencies
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "Installing Pillow dependencies with Homebrew..."
            brew install libjpeg libpng libtiff webp little-cms2 || true
        fi
        
        # Try again with the latest version
        if ! uv pip install pillow; then
            echo "Error: Failed to install Pillow. Please check your Python installation."
            exit 1
        fi
    fi
    
    # Then install the rest of the requirements
    if ! uv pip install -r requirements.txt; then
        echo "Error: Failed to install dependencies after Pillow fix."
        exit 1
    fi
fi

touch venv/.dependencies_installed

# Check if development database exists
check_database

# Run migrations for development database
echo "Running migrations for development database..."
DJANGO_ENV=development uv run --python 3.11 manage.py migrate

# Start Django development server in the background
echo "Starting Django development server..."
DJANGO_ENV=development DJANGO_DEBUG=True uv run --python 3.11 manage.py runserver 0.0.0.0:${DEV_BACKEND_PORT} &
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
PORT=${DEV_FRONTEND_PORT} npm start &
REACT_PID=$!

# Display information
echo ""
echo "Development servers started:"
echo "Backend running at: http://localhost:${DEV_BACKEND_PORT}"
echo "Frontend running at: http://localhost:${DEV_FRONTEND_PORT}"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to press Ctrl+C
trap "kill $DJANGO_PID $REACT_PID; exit" INT
wait 