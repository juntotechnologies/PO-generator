#!/bin/bash

# PO Generator Database Management Script
# This script helps manage database operations for both development and production environments

set -e  # Exit immediately if a command exits with a non-zero status

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "uv is not installed. Please install uv and try again."
    echo "You can install it using: pip install uv"
    exit 1
fi

# Navigate to the script directory
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR"

# Function to activate virtual environment
activate_venv() {
    if [ ! -d "venv" ]; then
        echo "Virtual environment not found. Creating one..."
        uv venv --python 3.11 venv
    fi
    source venv/bin/activate
}

# Function to deactivate virtual environment
deactivate_venv() {
    deactivate
}

# Function to make migrations (environment-agnostic)
make_migrations() {
    local app_name=$1
    local migration_name=$2
    
    activate_venv
    
    echo "Creating migrations..."
    if [ -z "$app_name" ]; then
        # Make migrations for all apps
        uv run --python 3.11 manage.py makemigrations
    elif [ -z "$migration_name" ]; then
        # Make migrations for specific app
        uv run --python 3.11 manage.py makemigrations "$app_name"
    else
        # Make migrations with a specific name
        uv run --python 3.11 manage.py makemigrations "$app_name" --name "$migration_name"
    fi
    
    deactivate_venv
}

# Function to apply migrations to development database
migrate_dev() {
    activate_venv
    
    echo "Applying migrations to development database..."
    DJANGO_ENV=development uv run --python 3.11 manage.py migrate
    
    deactivate_venv
}

# Function to apply migrations to production database
migrate_prod() {
    activate_venv
    
    echo "Applying migrations to production database..."
    DJANGO_ENV=production uv run --python 3.11 manage.py migrate
    
    deactivate_venv
}

# Function to apply migrations to both databases
migrate_all() {
    echo "Applying migrations to all databases..."
    migrate_dev
    migrate_prod
}

# Function to create a superuser in development
create_superuser_dev() {
    activate_venv
    
    echo "Creating superuser in development database..."
    DJANGO_ENV=development uv run --python 3.11 manage.py create_user admin admin123 --email admin@example.com --is_superuser
    
    deactivate_venv
}

# Function to create a superuser in production
create_superuser_prod() {
    activate_venv
    
    echo "Creating superuser in production database..."
    DJANGO_ENV=production uv run --python 3.11 manage.py create_user admin admin123 --email admin@example.com --is_superuser
    
    deactivate_venv
}

# Function to create PostgreSQL databases
create_databases() {
    echo "Creating PostgreSQL databases..."
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        echo "PostgreSQL client (psql) is not installed. Please install it and try again."
        return 1
    fi
    
    # Get database connection details
    read -p "PostgreSQL username [postgres]: " pg_user
    pg_user=${pg_user:-postgres}
    read -s -p "PostgreSQL password: " pg_password
    echo
    read -p "PostgreSQL host [localhost]: " pg_host
    pg_host=${pg_host:-localhost}
    read -p "PostgreSQL port [5432]: " pg_port
    pg_port=${pg_port:-5432}
    
    # Create production database
    echo "Creating production database (po_generator)..."
    PGPASSWORD="$pg_password" psql -h "$pg_host" -p "$pg_port" -U "$pg_user" -c "CREATE DATABASE po_generator;" postgres || echo "Database may already exist"
    
    # Create development database
    echo "Creating development database (po_generator_development)..."
    PGPASSWORD="$pg_password" psql -h "$pg_host" -p "$pg_port" -U "$pg_user" -c "CREATE DATABASE po_generator_development;" postgres || echo "Database may already exist"
    
    echo "Database creation completed."
}

# Main menu
show_menu() {
    echo "=========================================="
    echo "  PO Generator Database Management"
    echo "=========================================="
    echo "1. Make migrations"
    echo "2. Apply migrations to development database"
    echo "3. Apply migrations to production database"
    echo "4. Apply migrations to all databases"
    echo "5. Create PostgreSQL databases"
    echo "6. Create superuser in development"
    echo "7. Create superuser in production"
    echo "0. Exit"
    echo "=========================================="
    read -p "Enter your choice: " choice
    
    case $choice in
        1)
            read -p "App name (leave empty for all apps): " app_name
            if [ ! -z "$app_name" ]; then
                read -p "Migration name (leave empty for auto-generated name): " migration_name
                make_migrations "$app_name" "$migration_name"
            else
                make_migrations
            fi
            ;;
        2) migrate_dev ;;
        3) migrate_prod ;;
        4) migrate_all ;;
        5) create_databases ;;
        6) create_superuser_dev ;;
        7) create_superuser_prod ;;
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