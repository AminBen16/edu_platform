@echo off
setlocal
echo Starting complete local test system...
cd /d %~dp0
call npm run test:all
exit /b %errorlevel%
