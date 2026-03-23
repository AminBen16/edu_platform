@echo off
echo ==========================================
echo   EDU PLATFORM - ADVANCED TEST SUITE
echo ==========================================
echo.
echo [INFO] Ensuring API dependencies...
cd apps/api && npm install && cd ../..

echo.
echo [INFO] Ensuring Test dependencies...
cd testing && npm install && cd ..

echo.
echo [INFO] Launching Comprehensive Test Orchestrator...
node testing/run_comprehensive.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ TESTS FAILED!
    exit /b %errorlevel%
)
echo.
echo ✅ ALL TESTS PASSED!
pause
