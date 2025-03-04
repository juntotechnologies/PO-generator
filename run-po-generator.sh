#!/bin/bash

# Script to start the PO Generator application
# Automatically kills any existing process on port 3000 before starting
# Can run in foreground or background mode

# Set the port number
PORT=3000

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display header
echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}        Chem Is Try Inc - PO Generator        ${NC}"
echo -e "${BLUE}===============================================${NC}"

# Check if there's a process running on the port
echo -e "${YELLOW}Checking if port $PORT is in use...${NC}"
PROCESS_PID=$(lsof -ti:$PORT)

if [ ! -z "$PROCESS_PID" ]; then
    echo -e "${YELLOW}Process found on port $PORT (PID: $PROCESS_PID)${NC}"
    echo -e "${YELLOW}Stopping the process...${NC}"
    kill -9 $PROCESS_PID
    sleep 1
    echo -e "${GREEN}Process stopped successfully.${NC}"
else
    echo -e "${GREEN}No process found running on port $PORT.${NC}"
fi

# Get the server IP address
IP_ADDRESS=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n 1)

# Check if the script is run with the background flag
if [ "$1" = "-b" ] || [ "$1" = "--background" ]; then
    echo -e "${YELLOW}Starting PO Generator in background mode...${NC}"
    nohup node server.js > po-generator.log 2>&1 &
    
    # Save the PID for later use
    echo $! > .po-generator.pid
    
    echo -e "${GREEN}PO Generator is running in the background (PID: $!)${NC}"
    echo -e "${GREEN}Log file: po-generator.log${NC}"
    echo -e "${GREEN}To stop the server, run: ${YELLOW}./run-po-generator.sh --stop${NC}"
    echo -e "${BLUE}----------------------------------------------${NC}"
    echo -e "${GREEN}Access the application at:${NC}"
    echo -e "${YELLOW}Local:${NC} http://localhost:$PORT"
    echo -e "${YELLOW}Network:${NC} http://$IP_ADDRESS:$PORT"
elif [ "$1" = "-s" ] || [ "$1" = "--stop" ]; then
    if [ -f .po-generator.pid ]; then
        PID=$(cat .po-generator.pid)
        echo -e "${YELLOW}Stopping PO Generator (PID: $PID)...${NC}"
        kill -9 $PID 2>/dev/null
        rm .po-generator.pid
        echo -e "${GREEN}PO Generator stopped successfully.${NC}"
    else
        echo -e "${RED}PO Generator is not running or PID file not found.${NC}"
        # Try to find and kill process anyway
        PROCESS_PID=$(lsof -ti:$PORT)
        if [ ! -z "$PROCESS_PID" ]; then
            echo -e "${YELLOW}Found process on port $PORT (PID: $PROCESS_PID)${NC}"
            echo -e "${YELLOW}Stopping the process...${NC}"
            kill -9 $PROCESS_PID
            echo -e "${GREEN}Process stopped successfully.${NC}"
        fi
    fi
else
    # Run in foreground
    echo -e "${YELLOW}Starting PO Generator in foreground mode...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop the server.${NC}"
    echo -e "${BLUE}----------------------------------------------${NC}"
    echo -e "${GREEN}Access the application at:${NC}"
    echo -e "${YELLOW}Local:${NC} http://localhost:$PORT"
    echo -e "${YELLOW}Network:${NC} http://$IP_ADDRESS:$PORT"
    echo -e "${BLUE}----------------------------------------------${NC}"
    node server.js
fi 