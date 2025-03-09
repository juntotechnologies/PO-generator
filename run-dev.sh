#!/bin/bash

# Exit on error
set -e

echo "Starting Purchase Order Generator in development mode..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Start backend server in the background
echo "Starting Django backend server..."
cd backend
uv run manage.py runserver &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start frontend server
echo "Starting React frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Function to handle script termination
function cleanup {
    echo "Shutting down servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    echo "Servers stopped."
}

# Register the cleanup function for script termination
trap cleanup EXIT

# Keep the script running
echo "Development servers are running. Press Ctrl+C to stop."
wait 