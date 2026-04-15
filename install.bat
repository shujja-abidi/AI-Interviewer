@echo off
echo Installing Stuff
echo.
echo.
echo Press Ctrl+C to stop
echo.

echo Installing Node packages...
echo Backend Installation...

call cd ./backend

call install-packages.bat

call cd ..

call cd ./frontend

echo Frontend Installation...
npm install --legacy-peer-deps

echo Installation complete

pause

