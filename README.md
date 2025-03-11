# Purchase Order Generator

A web application for creating, managing, and generating PDF purchase orders with automatic signature generation.

## Features

- Create, edit, and duplicate purchase orders
- Automatic signature generation
- PDF generation with customizable layout
- User management system
- Responsive UI for desktop and mobile

## Installation

### Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn
- PostgreSQL

### PostgreSQL Setup

1. Install PostgreSQL if not already installed:
   - On macOS: `brew install postgresql`
   - On Ubuntu/Debian: `sudo apt-get install postgresql postgresql-contrib`
   - On Windows: Download from https://www.postgresql.org/download/windows/

2. Create the databases:
   ```
   chmod +x backend/manage_db.sh
   ./backend/manage_db.sh
   ```
   Then select option 5 to create the PostgreSQL databases.

### Project Setup

The project uses a single virtual environment in the `.venv` directory at the project root. All scripts have been configured to use this environment.

1. Make the app.sh script executable:
   ```
   chmod +x app.sh
   ```

2. Setup the development environment:
   ```
   ./app.sh setup dev
   ```

3. Setup the production environment:
   ```
   ./app.sh setup prod
   ```

## Development and Production Workflow

This application supports separate development and production environments with isolated databases.

### Development Environment

Run the development server with:

```
./app.sh dev
```

This will:
1. Start the Django development server on port 8000
2. Start the React development server on port 3000
3. Use a separate PostgreSQL database for development (`po_generator_development`)

### Production Environment

Deploy to production with:

```
./app.sh prod
```

This will:
1. Install PM2 if not already installed
2. Set up the backend with all dependencies
3. Run migrations on the production database
4. Build the frontend
5. Configure PM2 to run both the backend and frontend servers:
   - Backend: http://localhost:8001
   - Frontend: http://localhost:4567

### Database Management

To manage databases for both environments:

```
chmod +x backend/manage_db.sh
./backend/manage_db.sh
```

This script provides options to:
1. Make migrations (environment-agnostic)
2. Apply migrations to development database
3. Apply migrations to production database
4. Apply migrations to both databases
5. Create PostgreSQL databases
6. Create superuser in development
7. Create superuser in production

### User Management

To manage users in both environments:

```
chmod +x manage_users.sh
./manage_users.sh
```

This script provides options to:
1. List users (all, active, staff, superusers) in development
2. Create users in development
3. Reset passwords in development
4. List users (all, active, staff, superusers) in production
5. Create users in production
6. Reset passwords in production

## Using the Application

1. Log in with your credentials
2. Navigate to the Purchase Orders page to view existing orders
3. Click "Create New" to create a new purchase order
4. Fill in the required fields and add line items
5. Submit the form to create the purchase order
6. Use the "Preview PDF" button to view the generated PDF
7. Use the "Duplicate" button to create a copy of an existing purchase order

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.