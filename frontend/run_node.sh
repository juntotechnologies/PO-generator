#!/bin/bash
cd "$(dirname "$0")"
export PORT=4789
export NODE_ENV=production
node server.js
