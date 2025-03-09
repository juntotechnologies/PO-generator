# Purchase Order Generator

A web application for creating, managing, and generating Purchase Orders (POs) for businesses.

## Features

- User authentication and identity verification
- Purchase Order creation and management
- Vendor management with templates
- Line item management with templates
- PDF generation for professional Purchase Orders
- Customization options for payment terms, logos, and approval stamps

## Tech Stack

- **Frontend:** React
- **Backend:** Django
- **Database:** PostgreSQL

## Project Structure

The project is organized into two main directories:

- `backend/`: Django REST API
- `frontend/`: React application

## Getting Started

### Prerequisites

- Python 3.8+
- Node.js 14+
- PostgreSQL

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up the database:
   ```
   python manage.py migrate
   ```

5. Create a superuser:
   ```
   python manage.py createsuperuser
   ```

6. Run the development server:
   ```
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Usage

1. Log in to the application
2. Create vendors and save them as templates
3. Create line items and save them as templates
4. Create Purchase Orders by selecting vendors and line items
5. Generate PDFs of your Purchase Orders

## License

This project is licensed under the MIT License - see the LICENSE file for details.