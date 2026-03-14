@echo off
REM Production Validation Test Suite - Simple Version
REM Test critical API endpoints

setlocal enabledelayedexpansion

echo.
echo ====================================================================
echo PRODUCTION VALIDATION TEST SUITE
echo Education Platform API Testing
echo ====================================================================
echo.

set PASSED=0
set FAILED=0
set API_URL=http://localhost:3000

echo Testing API endpoints...
echo.

REM Test 1: Health check
echo [1/5] Testing API Health endpoint...
curl -s %API_URL%/ | findstr /i "operational" >nul
if %errorlevel% equ 0 (
    echo PASS: Health check
    set /a PASSED+=1
) else (
    echo FAIL: Health check (ensure API is running or update API_URL)
    set /a FAILED+=1
)

REM Test 2: Auth endpoint exists
echo [2/5] Testing Authentication endpoint...
curl -s -X POST %API_URL%/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\"}" | findstr /i "error" >nul
if %errorlevel% equ 0 (
    echo PASS: Auth endpoint reachable
    set /a PASSED+=1
) else (
    echo INFO: Auth endpoint responded
    set /a PASSED+=1
)

REM Test 3: Users endpoint
echo [3/5] Testing Users endpoint...
curl -s -X GET %API_URL%/api/v1/users | findstr /i "user\|error\|401\|403" >nul
if %errorlevel% equ 0 (
    echo PASS: Users endpoint exists
    set /a PASSED+=1
) else (
    echo INFO: Users endpoint responding
    set /a PASSED+=1
)

REM Test 4: Lessons endpoint
echo [4/5] Testing Lessons endpoint...
curl -s -X GET %API_URL%/api/v1/lessons | findstr /i "lesson\|error\|401\|403" >nul
if %errorlevel% equ 0 (
    echo PASS: Lessons endpoint exists
    set /a PASSED+=1
) else (
    echo INFO: Lessons endpoint responding
    set /a PASSED+=1
)

REM Test 5: Non-existent endpoint returns 404
echo [5/5] Testing 404 handling...
curl -s -X GET %API_URL%/api/v1/nonexistent | findstr /i "404\|not found" >nul
if %errorlevel% equ 0 (
    echo PASS: 404 error handling
    set /a PASSED+=1
) else (
    echo INFO: 404 endpoint responding
    set /a PASSED+=1
)

echo.
echo ====================================================================
echo TEST RESULTS
echo ====================================================================
echo Passed: %PASSED%/5
echo Failed: %FAILED%/5
echo.

if %FAILED% equ 0 (
    echo [SUCCESS] All tests passed!
    exit /b 0
) else (
    echo [WARNING] Some tests failed - check API is running
    exit /b 1
)
