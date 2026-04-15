@echo off
echo Starting both Node.js and Python servers...
echo.
echo Node.js server will run on port 5000
echo Python server will run on port 5500
echo.
echo Press Ctrl+C to stop both servers
echo.

start "Backend" cmd /k "cd backend & start-servers.bat"
start "Frontend" cmd /k "cd frontend & npm run dev"

echo Everything starting...
echo Check the opened windows for server status
