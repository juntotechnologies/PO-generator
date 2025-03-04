#!/bin/bash

# PO Generator Deployment Script
echo "===== PO Generator Deployment Script ====="
echo "This script will set up the PO Generator application to run 24/7 on port 4789"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js before continuing."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm before continuing."
    exit 1
fi

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    npm install -g pm2
else
    echo "PM2 is already installed."
fi

# Create logs directory
echo "Creating logs directory..."
mkdir -p logs

# Install dependencies
echo "Installing dependencies..."
npm install

# Start the application with PM2
echo "Starting the application as a service..."
pm2 start ecosystem.config.js

# Save the PM2 process list
echo "Saving the PM2 process list..."
pm2 save

# Set up PM2 to start on system boot
echo "Setting up PM2 to start on system boot..."
pm2 startup

echo ""
echo "===== Deployment Complete ====="
echo "The PO Generator is now running at:"
echo "- Local: http://localhost:4789"

# Get the local IP address
if command -v ip &> /dev/null; then
    LOCAL_IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1 | head -n 1)
elif command -v ifconfig &> /dev/null; then
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
else
    LOCAL_IP="YOUR_LOCAL_IP"
fi

echo "- Network: http://$LOCAL_IP:4789"
echo ""
echo "For more information, see the DEPLOY.md file." 