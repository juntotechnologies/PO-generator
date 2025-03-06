# PO Generator

A Purchase Order and Invoice Generator for Chem Is Try Inc, designed to run as a permanent service on your local network.

## Features

- Create and manage Purchase Orders
- Create and manage Invoices
- Custom logo upload capability
- Live preview of documents
- PDF generation and download
- Print functionality
- Two approval stamp options

## Permanent Deployment

This application is configured to run as a permanent service on port 4789, which ensures it's always available on your local network. 

### Quick Setup

```bash
# Make the deployment script executable if not already
chmod +x deploy-prod-po-generator.sh

# Run the deployment script
./deploy-prod-po-generator.sh
```

### Detailed Setup

For detailed deployment instructions, see the [DEPLOY.md](DEPLOY.md) file.

## Accessing the Application

Once deployed, the application will be accessible at:

- Local: http://localhost:4789
- Network: http://YOUR_LOCAL_IP:4789

## Development

### Prerequisites

- Node.js
- npm

### Setup

```bash
# Install dependencies
npm install

# Run in development mode
./run-dev-po-generator.sh
```

## License

Copyright © 2023 Chem Is Try Inc. All rights reserved.