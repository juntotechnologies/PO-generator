@echo off
echo ===== PO Generator Deployment Script =====
echo This script will set up the PO Generator application to run 24/7 on port 4789
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Please install Node.js before continuing.
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo npm is not installed. Please install npm before continuing.
    exit /b 1
)

REM Install PM2 globally if not already installed
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing PM2 globally...
    call npm install -g pm2
) else (
    echo PM2 is already installed.
)

REM Create logs directory
echo Creating logs directory...
if not exist logs mkdir logs

REM Install dependencies
echo Installing dependencies...
call npm install

REM Start the application with PM2
echo Starting the application as a service...
call pm2 start ecosystem.config.js

REM Save the PM2 process list
echo Saving the PM2 process list...
call pm2 save

REM Set up PM2 to start on system boot
echo Setting up PM2 to start on system boot...
call pm2 startup

echo.
echo ===== Deployment Complete =====
echo The PO Generator is now running at:
echo - Local: http://localhost:4789

REM Get the local IP address
FOR /F "tokens=4 delims= " %%i IN ('route print ^| find " 0.0.0.0"') DO SET LOCAL_IP=%%i
echo - Network: http://%LOCAL_IP%:4789
echo.
echo For more information, see the DEPLOY.md file.
echo.
pause 