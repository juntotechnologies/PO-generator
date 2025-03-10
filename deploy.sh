#!/bin/bash

# PO Generator Deployment Script
# This script deploys the PO Generator application using PM2

set -e  # Exit immediately if a command exits with a non-zero status

echo "Starting PO Generator deployment..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

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

# Backend deployment
echo "Deploying backend..."
cd backend

# Remove existing virtual environment if it exists
if [ -d "venv" ]; then
    echo "Removing existing virtual environment..."
    rm -rf venv
fi

# Create a new virtual environment with Python 3.11
echo "Creating virtual environment with Python 3.11..."
uv venv --python 3.11 venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
if ! uv pip install -r requirements.txt; then
    echo "Error: Failed to install dependencies."
    echo "Trying alternative approach for Pillow..."
    
    # Try installing Pillow separately first
    if ! uv pip install --no-deps pillow==10.0.0; then
        echo "Error: Failed to install Pillow. Please check your Python installation."
        exit 1
    fi
    
    # Then install the rest of the requirements
    if ! uv pip install -r requirements.txt; then
        echo "Error: Failed to install dependencies after Pillow fix."
        exit 1
    fi
fi

# Run migrations
echo "Running migrations..."
if ! DJANGO_ENV=production uv run --python 3.11 manage.py migrate; then
    echo "Error: Failed to run migrations."
    exit 1
fi

# Collect static files
echo "Collecting static files..."
if ! DJANGO_ENV=production uv run --python 3.11 manage.py collectstatic --noinput; then
    echo "Error: Failed to collect static files."
    exit 1
fi

# Create a simple script to run the Django server
echo "Creating run script for Django..."
cat > run_django.sh << 'EOL'
#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
export DJANGO_ENV=production
export DJANGO_DEBUG=False
uv run --active manage.py runserver 0.0.0.0:8000
EOL

# Make the script executable
chmod +x run_django.sh

# Deactivate virtual environment
deactivate

# Configure PM2 for Django
echo "Configuring PM2 for Django..."
pm2 delete po-generator-backend 2>/dev/null || true
pm2 start --name po-generator-backend "$PROJECT_DIR/backend/run_django.sh"

# Frontend deployment
echo "Deploying frontend..."
cd ../frontend

# Install dependencies
echo "Installing frontend dependencies..."
if ! npm install; then
    echo "Error: Failed to install frontend dependencies."
    exit 1
fi

# Build the frontend
echo "Building frontend..."
if ! npm run build; then
    echo "Error: Failed to build frontend."
    exit 1
fi

# Create a simple server file for serving on custom port
echo "Creating server file for port 4567..."
cat > server.js << 'EOL'
const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

// For any request that doesn't match a static file, serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 4567;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOL

# Make sure express is installed
if ! npm install --save express; then
    echo "Error: Failed to install express."
    exit 1
fi

# Create a simple script to run the Node server
echo "Creating run script for Node..."
cat > run_node.sh << 'EOL'
#!/bin/bash
cd "$(dirname "$0")"
export PORT=4567
export NODE_ENV=production
node server.js
EOL

# Make the script executable
chmod +x run_node.sh

# Configure PM2 for React
echo "Configuring PM2 for React on port 4567..."
pm2 delete po-generator-frontend 2>/dev/null || true
pm2 start --name po-generator-frontend "$PROJECT_DIR/frontend/run_node.sh"

# Save PM2 configuration
echo "Saving PM2 configuration..."
pm2 save

echo "Deployment completed successfully!"
echo "Backend running at: http://localhost:8000"
echo "Frontend running at: http://localhost:4567"
echo ""
echo "To check status: pm2 status"
echo "To view logs: pm2 logs"
echo "To restart: pm2 restart po-generator-backend po-generator-frontend"
echo "To stop: pm2 stop po-generator-backend po-generator-frontend" 