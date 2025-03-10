#!/bin/bash

# PO Generator User Management Script
# This script provides a simple interface for managing users in the PO Generator application

set -e  # Exit immediately if a command exits with a non-zero status

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "uv is not installed. Please install uv and try again."
    echo "You can install it using: pip install uv"
    exit 1
fi

# Navigate to the project directory
PROJECT_DIR=$(dirname "$0")
cd "$PROJECT_DIR"

# Function to activate virtual environment
activate_venv() {
    cd backend
    if [ ! -d "venv" ]; then
        echo "Virtual environment not found. Creating one..."
        uv venv --python 3.11 venv
    fi
    source venv/bin/activate
}

# Function to deactivate virtual environment and return to project root
deactivate_and_return() {
    deactivate
    cd ..
}

# Function to list users
list_users() {
    local filter=$1
    local env=$2
    
    cd backend
    
    echo "Listing users in $env environment..."
    if [ -z "$filter" ]; then
        DJANGO_ENV=$env uv run --python 3.11 manage.py list_users
    else
        DJANGO_ENV=$env uv run --python 3.11 manage.py list_users --$filter
    fi
    
    cd ..
}

# Function to create a user
create_user() {
    local env=$1
    
    cd backend
    
    echo "Creating a new user in $env environment..."
    
    # Get user details
    read -p "Username: " username
    read -s -p "Password: " password
    echo
    read -p "Email: " email
    read -p "First name (optional): " first_name
    read -p "Last name (optional): " last_name
    read -p "Make staff user? (y/n): " staff
    read -p "Make superuser? (y/n): " superuser
    
    # Build command
    cmd="DJANGO_ENV=$env uv run --python 3.11 manage.py create_user $username $password --email $email"
    
    if [ ! -z "$first_name" ]; then
        cmd="$cmd --first_name \"$first_name\""
    fi
    
    if [ ! -z "$last_name" ]; then
        cmd="$cmd --last_name \"$last_name\""
    fi
    
    if [ "$staff" = "y" ]; then
        cmd="$cmd --is_staff"
    fi
    
    if [ "$superuser" = "y" ]; then
        cmd="$cmd --is_superuser"
    fi
    
    # Execute command
    eval $cmd
    
    cd ..
}

# Function to reset a user's password
reset_password() {
    local env=$1
    
    cd backend
    
    echo "Resetting user password in $env environment..."
    
    # Get user details
    read -p "Username: " username
    read -s -p "New password: " password
    echo
    
    # Execute command to change password
    echo "Changing password for user: $username"
    DJANGO_ENV=$env uv run --python 3.11 manage.py changepassword $username << EOF
$password
$password
EOF
    
    if [ $? -eq 0 ]; then
        echo "Password reset successful for user: $username in $env environment"
    else
        echo "Failed to reset password. Make sure the username exists in the $env database."
    fi
    
    cd ..
}

# Main menu
show_menu() {
    echo "=========================================="
    echo "  PO Generator User Management"
    echo "=========================================="
    echo "DEVELOPMENT ENVIRONMENT:"
    echo "1. List all users (dev)"
    echo "2. List active users (dev)"
    echo "3. List staff users (dev)"
    echo "4. List superusers (dev)"
    echo "5. Create a new user (dev)"
    echo "6. Reset user password (dev)"
    echo ""
    echo "PRODUCTION ENVIRONMENT:"
    echo "11. List all users (prod)"
    echo "12. List active users (prod)"
    echo "13. List staff users (prod)"
    echo "14. List superusers (prod)"
    echo "15. Create a new user (prod)"
    echo "16. Reset user password (prod)"
    echo ""
    echo "0. Exit"
    echo "=========================================="
    read -p "Enter your choice: " choice
    
    case $choice in
        # Development environment
        1) list_users "" "development" ;;
        2) list_users "active" "development" ;;
        3) list_users "staff" "development" ;;
        4) list_users "superusers" "development" ;;
        5) create_user "development" ;;
        6) reset_password "development" ;;
        
        # Production environment
        11) list_users "" "production" ;;
        12) list_users "active" "production" ;;
        13) list_users "staff" "production" ;;
        14) list_users "superusers" "production" ;;
        15) create_user "production" ;;
        16) reset_password "production" ;;
        
        0) exit 0 ;;
        *) echo "Invalid choice. Please try again." ;;
    esac
    
    # Return to menu after action
    echo
    read -p "Press Enter to continue..."
    show_menu
}

# Start the script
show_menu 