#!/bin/bash
cd "$(dirname "$0")"

# Get environment from command line argument, default to production if not provided
ENV=${1:-production}

if [ "$ENV" = "development" ] || [ "$ENV" = "dev" ]; then
  export NODE_ENV=development
  export PORT=${DEV_FRONTEND_PORT:-3000}
  export REACT_APP_API_URL=http://localhost:${DEV_BACKEND_PORT:-8000}
  npm start
else
  export NODE_ENV=production
  export PORT=${PROD_FRONTEND_PORT:-4567}
  export REACT_APP_API_URL=http://localhost:${PROD_BACKEND_PORT:-8001}
  node server.js
fi
