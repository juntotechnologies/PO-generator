#!/bin/bash
set -e

# Display usage information
show_usage() {
  echo "Usage: $0 [options] <command>"
  echo ""
  echo "Commands:"
  echo "  dev         Run in development mode"
  echo "  prod        Run in production mode"
  echo "  migrate     Run database migrations"
  echo "  setup       Setup the environment without starting servers"
  echo ""
  echo "Options:"
  echo "  --help      Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0 dev                  # Run in development mode"
  echo "  $0 prod                 # Run in production mode"
  echo "  $0 migrate dev          # Run migrations for development"
  echo "  $0 migrate prod         # Run migrations for production"
  echo "  $0 setup dev            # Setup development environment"
  echo "  $0 setup prod           # Setup production environment"
}

# Function: Check if a port is in use, and if so, prompt to kill it.
check_port() {
  local port=$1
  if lsof -i tcp:"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Port $port is already in use."
    read -p "Kill the process using port $port and continue? [y/n] " answer
    if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
      pid=$(lsof -i tcp:"$port" -sTCP:LISTEN -t)
      kill -9 $pid
      echo "Killed process $pid on port $port."
    else
      echo "Exiting deployment."
      exit 1
    fi
  fi
}

# Load environment variables from .env file (but don't rely on ENVIRONMENT)
if [ -f ".env" ]; then
  source .env
fi

# Parse command-line arguments
COMMAND=""
ENVIRONMENT=""

# Check if we have any arguments
if [ $# -eq 0 ]; then
  show_usage
  exit 1
fi

# Parse arguments
while [ $# -gt 0 ]; do
  case "$1" in
    dev)
      ENVIRONMENT="development"
      if [ -z "$COMMAND" ]; then
        COMMAND="run"
      fi
      ;;
    prod)
      ENVIRONMENT="production"
      if [ -z "$COMMAND" ]; then
        COMMAND="run"
      fi
      ;;
    migrate)
      COMMAND="migrate"
      ;;
    setup)
      COMMAND="setup"
      ;;
    --help)
      show_usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      show_usage
      exit 1
      ;;
  esac
  shift
done

# Ensure we have both a command and environment
if [ -z "$ENVIRONMENT" ]; then
  echo "Error: You must specify either 'dev' or 'prod'"
  show_usage
  exit 1
fi

# Ensure required tools are installed
command -v uv &> /dev/null || { echo "uv is not installed."; exit 1; }
if ! uv python list | grep -q "3.11"; then
  uv python install 3.11
fi

PROJECT_DIR=$(cd "$(dirname "$0")" && pwd)
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Function: Setup Backend
setup_backend() {
  echo "Setting up backend environment for $ENVIRONMENT..."
  # Create virtual environment in the backend directory but run commands from project root
  [ -d "$BACKEND_DIR/venv" ] && rm -rf "$BACKEND_DIR/venv"
  
  # Create venv in backend directory
  uv venv --python 3.11 "$BACKEND_DIR/venv"
  
  # Activate the virtual environment
  source "$BACKEND_DIR/venv/bin/activate"
  
  # Check if requirements.txt exists in backend directory, if not use the one in project root
  if [ -f "$BACKEND_DIR/requirements.txt" ]; then
    REQUIREMENTS_FILE="$BACKEND_DIR/requirements.txt"
  elif [ -f "$PROJECT_DIR/requirements.txt" ]; then
    REQUIREMENTS_FILE="$PROJECT_DIR/requirements.txt"
  else
    echo "requirements.txt not found in either backend directory or project root."
    exit 1
  fi
  
  echo "Using requirements file: $REQUIREMENTS_FILE"
  
  # Install dependencies
  uv pip install -r "$REQUIREMENTS_FILE" || { echo "Dependency installation failed."; exit 1; }
  
  # Deactivate virtual environment
  deactivate
}

# Function: Run migrations
run_migrations() {
  echo "Running migrations for $ENVIRONMENT..."
  source "$BACKEND_DIR/venv/bin/activate"
  
  # Set environment variables for the migration
  if [ "$ENVIRONMENT" = "production" ]; then
    export DJANGO_ENV=production
    export DJANGO_DEBUG=False
  else
    export DJANGO_ENV=development
    export DJANGO_DEBUG=True
  fi
  
  # Run migrations from project root
  uv run --python 3.11 "$BACKEND_DIR/manage.py" migrate
  
  # Deactivate virtual environment
  deactivate
}

# Function: Setup Frontend for production
setup_frontend_prod() {
  echo "Setting up frontend for production..."
  # Run npm commands in the frontend directory
  (cd "$FRONTEND_DIR" && npm install) || exit 1
  (cd "$FRONTEND_DIR" && npm run build) || exit 1
  
  # Create server.js in frontend directory
  cat > "$FRONTEND_DIR/server.js" << 'EOL'
const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'build', 'index.html')));
const PORT = process.env.PORT || 4567;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
EOL

  # Install express
  (cd "$FRONTEND_DIR" && npm install --save express) || exit 1
  
  # Create run_node.sh script
  cat > "$FRONTEND_DIR/run_node.sh" << 'EOL'
#!/bin/bash
cd "$(dirname "$0")"
export PORT=4567
export NODE_ENV=production
node server.js
EOL
  chmod +x "$FRONTEND_DIR/run_node.sh"
}

# Function: Configure PM2 for production
configure_pm2() {
  echo "Configuring PM2 for production..."
  command -v pm2 &> /dev/null || npm install -g pm2
  
  # Create run script for Django
  cat > "$BACKEND_DIR/run_django.sh" << 'EOL'
#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
export DJANGO_ENV=production
export DJANGO_DEBUG=False
uv run --active manage.py runserver 0.0.0.0:8000
EOL
  chmod +x "$BACKEND_DIR/run_django.sh"
  
  # Configure PM2
  pm2 delete po-generator-backend 2>/dev/null || true
  pm2 start --name po-generator-backend "$BACKEND_DIR/run_django.sh"
  pm2 delete po-generator-frontend 2>/dev/null || true
  pm2 start --name po-generator-frontend "$FRONTEND_DIR/run_node.sh"
  pm2 save
}

# Main execution based on command and environment
case "$COMMAND" in
  "setup")
    setup_backend
    if [ "$ENVIRONMENT" = "production" ]; then
      setup_frontend_prod
    fi
    echo "Setup completed for $ENVIRONMENT environment."
    ;;
    
  "migrate")
    # Make sure backend is set up
    if [ ! -d "$BACKEND_DIR/venv" ]; then
      setup_backend
    fi
    run_migrations
    echo "Migrations completed for $ENVIRONMENT environment."
    ;;
    
  "run")
    # Make sure backend is set up
    if [ ! -d "$BACKEND_DIR/venv" ]; then
      setup_backend
    fi
    
    # Run migrations
    run_migrations
    
    if [ "$ENVIRONMENT" = "production" ]; then
      # Check ports for production: backend on 8000 and frontend on 4567
      check_port 8000
      check_port 4567
      setup_frontend_prod
      configure_pm2
      echo "Production deployment completed. Backend at http://localhost:8000, Frontend at http://localhost:4567."
    else
      # Check ports for development: backend on 8001 and frontend on 3000
      check_port 8001
      check_port 3000
      
      # For development: start servers directly without PM2
      # Activate virtual environment without changing directory
      source "$BACKEND_DIR/venv/bin/activate"
      
      # Start Django server from project root
      export DJANGO_ENV=development
      export DJANGO_DEBUG=True
      uv run --python 3.11 "$BACKEND_DIR/manage.py" runserver 0.0.0.0:8001 &
      DJANGO_PID=$!
      
      # Deactivate virtual environment
      deactivate
      
      # Start React development server
      (cd "$FRONTEND_DIR" && [ -d "node_modules" ] || npm install)
      (cd "$FRONTEND_DIR" && PORT=3000 npm start) &
      REACT_PID=$!
      
      echo "Development servers started: Backend at http://localhost:8001, Frontend at http://localhost:3000."
      echo "Press Ctrl+C to stop both servers"
      
      # Wait for user to press Ctrl+C
      trap "kill $DJANGO_PID $REACT_PID; exit" INT
      wait
    fi
    ;;
    
  *)
    echo "Unknown command: $COMMAND"
    show_usage
    exit 1
    ;;
esac
