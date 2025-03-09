#!/bin/bash

# Exit on error
set -e

echo "Starting deployment of Purchase Order Generator..."

# Backend deployment
echo "Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt

# Run migrations
echo "Running database migrations..."
python manage.py migrate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser if needed (will prompt for credentials)
read -p "Do you want to create a superuser? (y/n) " create_superuser
if [ "$create_superuser" = "y" ]; then
    python manage.py createsuperuser
fi

# Return to root directory
cd ..

# Frontend deployment
echo "Setting up frontend..."
cd frontend

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Build frontend
echo "Building frontend..."
npm run build

# Return to root directory
cd ..

echo "Deployment completed successfully!"
echo "To run the development servers:"
echo "  Backend: cd backend && source venv/bin/activate && python manage.py runserver"
echo "  Frontend: cd frontend && npm start"
echo ""
echo "For production deployment, configure your web server to serve the Django application"
echo "and the React build folder." 