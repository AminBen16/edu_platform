@echo off
echo ==========================================
echo   EDU PLATFORM - COMPLETE TEST SUITE
echo ==========================================
echo.
cd testing
node orchestrator.js
if %errorlevel% neq 0 (
    echo.
    echo ❌ TESTS FAILED!
    exit /b %errorlevel%
)
echo.
echo ✅ ALL TESTS PASSED!
pause
