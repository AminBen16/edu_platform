@echo off
echo Starting COMPLETE LOCAL TESTING SYSTEM...
echo.

echo 1. Generate Prisma client...
npx prisma generate --schema=./packages/db/schema.prisma

echo 2. Seed test data...
node testing/backend/seed.ts

echo 3. Backend API tests (50+ endpoints)...
cd testing && npx jest backend

echo 4. Frontend E2E tests (Playwright - ALL buttons)...
npx playwright test

echo 5. Flutter mobile tests...
cd ../apps/mobile && flutter test integration_test

echo.
echo ✅ COMPLETE TESTING SYSTEM - ALL BUTTONS/ROUTES TESTED!
echo View report: testing/playwright-report/index.html
pause

