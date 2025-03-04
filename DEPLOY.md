# PO Generator Deployment Guide

This guide will help you set up the PO Generator application as a permanent service on your local network, accessible 24/7 on port 4789.

## Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)
- PM2 (a process manager for Node.js applications)

## Installation Steps

### 1. Install PM2 globally

```bash
npm install -g pm2
```

### 2. Create logs directory

```bash
mkdir -p logs
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the application as a service

```bash
pm2 start ecosystem.config.js
```

### 5. Save the PM2 process list

```bash
pm2 save
```

### 6. Set up PM2 to start on system boot

For Linux/Mac:
```bash
pm2 startup
```

For Windows:
```bash
pm2 startup
```

Follow the instructions provided by the command.

## Accessing the Application

Once deployed, the application will be accessible at:

- Local: http://localhost:4789
- Network: http://YOUR_LOCAL_IP:4789

Replace `YOUR_LOCAL_IP` with the IP address of the machine running the application.

## Monitoring and Management

### View application logs

```bash
pm2 logs po-generator
```

### Check application status

```bash
pm2 status
```

### Restart application

```bash
pm2 restart po-generator
```

### Stop application

```bash
pm2 stop po-generator
```

## Troubleshooting

If the application is not accessible:

1. Check if the application is running:
   ```bash
   pm2 status
   ```

2. Check if the port is in use:
   ```bash
   lsof -i :4789
   ```

3. Review the logs:
   ```bash
   pm2 logs po-generator
   ```

4. Ensure your firewall allows traffic on port 4789.

## Updating the Application

When you need to update the application:

1. Pull the latest changes:
   ```bash
   git pull
   ```

2. Install any new dependencies:
   ```bash
   npm install
   ```

3. Restart the application:
   ```bash
   pm2 restart po-generator
   ``` 