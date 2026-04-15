@echo off
echo Installing packages Node and Python...
echo.
echo.
echo Press Ctrl+C to stop
echo.

echo Installing Node packages...
call npm install

echo Setting up Python environment...

call python -m venv venv

echo Activating Python environment...
call venv\Scripts\activate

echo Installing Python packages...
call pip install -r requirements.txt

echo Installation complete

pause

