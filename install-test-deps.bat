@echo off
echo Installing dependencies for testing system...

echo.
echo [1/3] Installing Root/Testing dependencies...
cd testing
call npm install
call npx playwright install chromium

echo.
echo [2/3] Installing API dependencies...
cd ..\apps\api
call npm install

echo.
echo [3/3] Installing Admin App dependencies...
cd ..\admin
call npm install

echo.
echo ✅ Done! You can now run 'run-all-tests.bat'
pause
