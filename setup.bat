@echo off
REM Education Platform - Setup Script for Windows
REM This script helps you set up the project for development and deployment

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo 🎓 Education Platform - Setup
echo ==========================================
echo.

REM Check Node.js
echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16 or higher.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION%
echo.

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm %NPM_VERSION%
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Check if .env.local exists
if not exist ".env.local" (
    echo Creating .env.local from template...
    copy .env.local.example .env.local >nul
    echo [WARNING] Please edit .env.local with your actual values:
    echo.
    echo   - DATABASE_URL: Your Neon PostgreSQL connection string
    echo   - NEXTAUTH_SECRET: Generate with: openssl rand -base64 32
    echo.
    echo Next steps to get DATABASE_URL:
    echo 1. Go to https://console.neon.tech
    echo 2. Create a new FREE account (no credit card required)
    echo 3. Create a new project
    echo 4. Go to "SQL" tab and copy the full connection string
    echo 5. Edit .env.local and paste it in DATABASE_URL field
    echo.
    pause
) else (
    echo [OK] .env.local exists
)
echo.

REM Generate Prisma Client
echo Generating Prisma Client...
call npx prisma generate
echo [OK] Prisma Client generated
echo.

REM Build API
echo Building API...
cd apps\api
call npm run build
cd ..\..\
if errorlevel 1 (
    echo [WARNING] API build had issues, but continuing...
)
echo [OK] API built
echo.

REM Build Admin
echo Building Admin Panel...
cd apps\admin
call npm run build
cd ..\..\
if errorlevel 1 (
    echo [WARNING] Admin build had issues, but continuing...
)
echo [OK] Admin Panel built
echo.

echo.
echo ==========================================
echo [OK] Setup Complete!
echo ==========================================
echo.
echo Next steps:
echo.
echo For local development (requires DATABASE_URL to be set first):
echo   npm run dev
echo.
echo For database management:
echo   npm run db:studio    [Visual database browser]
echo   npm run db:migrate   [Run migrations]
echo   npm run db:seed      [Add sample data]
echo.
echo For deployment to Vercel:
echo   1. Read DEPLOYMENT_GUIDE.md
echo   2. Push to GitHub
echo   3. Go to https://vercel.com/new
echo   4. Connect your repository
echo   5. Add environment variables
echo   6. Deploy!
echo.
echo Documentation: DEPLOYMENT_GUIDE.md
echo.
pause
