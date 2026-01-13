@echo off
REM GreenRoute Development Server Startup Script for Windows

echo.
echo ========================================
echo  GreenRoute - Development Server Startup
echo ========================================
echo.

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Starting Backend Server on port 5000...
echo.

REM Navigate to Backend directory
cd /d "%~dp0Backend"

REM Check if node_modules exists, if not run npm install
if not exist "node_modules" (
    echo Installing Backend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Backend dependencies
        pause
        exit /b 1
    )
)

REM Start the backend server
echo.
echo Starting Backend...
start cmd /k "npm start"

REM Wait for backend to start
timeout /t 3 /nobreak

REM Navigate to Frontend directory
cd /d "%~dp0GreenRo-main"

REM Check if node_modules exists, if not run npm install
if not exist "node_modules" (
    echo Installing Frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Frontend dependencies
        pause
        exit /b 1
    )
)

REM Start the frontend server
echo.
echo Starting Frontend on port 3000...
start cmd /k "npm start"

echo.
echo ========================================
echo Servers are starting...
echo Backend: https://green-route-3.onrender.com
echo Frontend: http://localhost:3000
echo ========================================
echo.
echo Close this window when done.
pause
