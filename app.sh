#!/bin/bash
set -e

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

# Load environment variables
if [ -f ".env" ]; then
  source .env
else
  echo ".env file not found." && exit 1
fi

if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "development" ]]; then
  echo "ENVIRONMENT must be 'production' or 'development'" && exit 1
fi

# Ensure required tools are installed
command -v uv &> /dev/null || { echo "uv is not installed."; exit 1; }
if ! uv python list | grep -q "3.11"; then
  uv python install 3.11
fi

PROJECT_DIR=$(cd "$(dirname "$0")" && pwd)

# Function: Setup Backend
setup_backend() {
  cd "$PROJECT_DIR/backend"
  [ -d "venv" ] && rm -rf venv
  uv venv --python 3.11 venv
  source venv/bin/activate
  uv pip install -r requirements.txt || { echo "Dependency installation failed."; exit 1; }
  # Run migrations: use ENVIRONMENT variable to switch between prod and dev
  uv run --python 3.11 manage.py migrate
  deactivate
  cd "$PROJECT_DIR"
}

# Function: Setup Frontend for production
setup_frontend_prod() {
  cd "$PROJECT_DIR/frontend"
  npm install || exit 1
  npm run build || exit 1
  cat > server.js << 'EOL'
#!/bin/bash
const express = require('express');
const path = require('path');
const app = express();
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'build', 'index.html')));
const PORT = process.env.PORT || 4567;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
EOL
  npm install --save express || exit 1
  cat > run_node.sh << 'EOL'
#!/bin/bash
cd "$(dirname "$0")"
export PORT=4567
export NODE_ENV=production
node server.js
EOL
  chmod +x run_node.sh
  cd "$PROJECT_DIR"
}

# Function: Configure PM2 for production
configure_pm2() {
  command -v pm2 &> /dev/null || npm install -g pm2
  # Create run script for Django
  cat > "$PROJECT_DIR/backend/run_django.sh" << 'EOL'
#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
export ENVIRONMENT=production
export DJANGO_DEBUG=False
uv run --active manage.py runserver 0.0.0.0:8000
EOL
  chmod +x "$PROJECT_DIR/backend/run_django.sh"
  pm2 delete po-generator-backend 2>/dev/null || true
  pm2 start --name po-generator-backend "$PROJECT_DIR/backend/run_django.sh"
  pm2 delete po-generator-frontend 2>/dev/null || true
  pm2 start --name po-generator-frontend "$PROJECT_DIR/frontend/run_node.sh"
  pm2 save
}

# Main execution
setup_backend

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
  cd "$PROJECT_DIR/backend"
  source venv/bin/activate
  ENVIRONMENT=development DJANGO_DEBUG=True uv run --python 3.11 manage.py runserver 0.0.0.0:8001 &
  DJANGO_PID=$!
  deactivate
  cd "$PROJECT_DIR/frontend"
  [ -d "node_modules" ] || npm install
  PORT=3000 npm start &
  REACT_PID=$!
  echo "Development servers started: Backend at http://localhost:8001, Frontend at http://localhost:3000."
  trap "kill $DJANGO_PID $REACT_PID; exit" INT
  wait
fi
