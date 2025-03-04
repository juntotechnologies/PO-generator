# PO Generator

A web application for generating Purchase Orders for Chem Is Try Inc.

## Features

- Simple, user-friendly interface with live preview
- Generate professional-looking purchase orders
- Downloadable PDF documents
- Automatic PO numbering (CITMMDDYY-X format)
- Multiple line items with automatic calculations
- Custom or default logo options

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

## Running the Application

### Using the Startup Scripts

The application comes with convenient startup scripts that automatically kill any existing processes on port 3000 and start the application.

#### On macOS/Linux:

Make the script executable first:

```bash
chmod +x run-po-generator.sh
```

Then run the application:

```bash
./run-po-generator.sh            # Run in foreground
./run-po-generator.sh -b         # Run in background
./run-po-generator.sh --stop     # Stop a background instance
```

#### On Windows:

```
run-po-generator.bat
```

### Manual Start

If you prefer not to use the scripts:

```bash
npm start
```

## Accessing the Application

- Locally: http://localhost:3000
- From other devices on the network: http://YOUR_IP_ADDRESS:3000

## Usage

1. Fill in the PO information (date, vendor details, etc.)
2. See your PO take shape in real-time in the preview pane
3. Add line items with quantity, description, and rate
4. Click "Generate PO" to create the final PDF
5. Download the PDF

## For Always-On Usage

To keep the application running continuously, you can use either:

1. **The included script:** `./run-po-generator.sh -b`

2. **PM2 (for more advanced management):**

```bash
# Install PM2 globally
npm install -g pm2

# Start the application with PM2
pm2 start server.js --name "po-generator"

# Set PM2 to start on system boot
pm2 startup
pm2 save
```

## Technical Details

- Frontend: HTML, CSS, JavaScript with Bootstrap
- Backend: Node.js with Express
- PDF Generation: PDFMake with Helvetica fonts
- No database required