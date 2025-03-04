@echo off
echo ===============================================
echo        Chem Is Try Inc - PO Generator
echo ===============================================

set PORT=3000

echo Checking if port %PORT% is in use...
netstat -ano | findstr :%PORT% > temp.txt
set /p RESULT=<temp.txt
del temp.txt

if not "%RESULT%" == "" (
    for /f "tokens=5" %%a in ("%RESULT%") do (
        set PID=%%a
    )
    echo Process found on port %PORT% ^(PID: %PID%^)
    echo Stopping the process...
    taskkill /F /PID %PID%
    timeout /t 1 > nul
    echo Process stopped successfully.
) else (
    echo No process found running on port %PORT%.
)

echo Starting PO Generator...
echo Press Ctrl+C to stop the server.
echo -----------------------------------------------
echo Access the application at:
echo Local: http://localhost:%PORT%
echo Network: Use your computer's IP address
echo -----------------------------------------------

node server.js 