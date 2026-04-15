@echo off
echo Starting both Node.js and Python servers...
echo.
echo Node.js server will run on port 5000
echo Python server will run on port 5500
echo.
echo Press Ctrl+C to stop both servers
echo.

start "Node.js Server" cmd /k "node index.js"
start "Python Server" cmd /k "venv\Scripts\python.exe server.py"

echo Both servers are starting...
echo Check the opened windows for server status
