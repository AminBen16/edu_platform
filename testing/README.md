# Complete Local Testing System

This testing system runs the platform locally and verifies:

- API route discovery and smoke coverage
- Prisma schema, tables, and seed data
- Admin page discovery, browser crawling, button clicking, and form filling
- Flutter app startup and route crawling
- Crash detection, console errors, broken requests, and auth failures

## Folder Structure

```text
testing/
  config/
    local-test.config.json
  coverage/
    api-endpoints.json
    admin-pages.json
  frontend/
    platform-crawler.spec.ts
  mobile/
    expanded_test.dart
  results/
    admin-crawl-summary.json
    api-smoke.json
    db-validation.json
    logs/
  scripts/
    _lib.js
    discover-api-routes.js
    discover-admin-pages.js
    db-validate.js
    api-smoke.js
    mobile-runner.js
    orchestrator.js
```

Flutter integration tests live in:

```text
apps/mobile/integration_test/
  app_test.dart
  route_crawler_test.dart
```

## Dependencies To Install

Run these once:

```powershell
cd c:\Users\user\Desktop\edu_platform\apps\admin
npm install

cd c:\Users\user\Desktop\edu_platform\apps\api
npm install

cd c:\Users\user\Desktop\edu_platform\testing
npm install
npm run install:browsers

cd c:\Users\user\Desktop\edu_platform\apps\mobile
flutter pub get
```

## Exact Terminal Commands

### One-command full local run

```powershell
cd c:\Users\user\Desktop\edu_platform\testing
npm run test:all
```

### Step-by-step local run

1. Discover backend and frontend surfaces

```powershell
cd c:\Users\user\Desktop\edu_platform\testing
npm run discover:api
npm run discover:admin
```

2. Seed and validate the database

```powershell
cd c:\Users\user\Desktop\edu_platform\testing
npm run db:seed
npm run db:validate
```

3. Start backend

```powershell
cd c:\Users\user\Desktop\edu_platform\apps\api
npm run prisma:generate
npm run build
npm run start
```

Expected:
- API should respond at `http://127.0.0.1:3002/api/health`

4. Start admin

```powershell
cd c:\Users\user\Desktop\edu_platform\apps\admin
npm run dev
```

Expected:
- Admin should open at `http://127.0.0.1:3000/auth/login`

5. Run backend smoke tests

```powershell
cd c:\Users\user\Desktop\edu_platform\testing
npm run test:api
```

6. Run browser automation

```powershell
cd c:\Users\user\Desktop\edu_platform\testing
npm run test:ui
```

Optional headed browser:

```powershell
cd c:\Users\user\Desktop\edu_platform\testing
npm run test:ui:headed
```

7. Run Flutter integration tests

```powershell
cd c:\Users\user\Desktop\edu_platform\testing
npm run test:mobile
```

The mobile runner uses:
- `apps/mobile/integration_test/app_test.dart`
- `apps/mobile/integration_test/route_crawler_test.dart`

## What Each Script Does

### `npm run discover:api`

- Scans `apps/api/src/index.ts`
- Resolves mounted routers
- Parses route files
- Writes `testing/coverage/api-endpoints.json`

### `npm run discover:admin`

- Scans `apps/admin/pages`
- Builds a page manifest
- Writes `testing/coverage/admin-pages.json`

### `npm run db:validate`

- Checks Prisma-backed tables exist
- Runs sample counts on key models
- Verifies seeded users exist
- Writes `testing/results/db-validation.json`

### `npm run test:api`

- Logs in with seeded admin credentials
- Runs curated auth and workflow checks
- Smoke-tests every discovered endpoint
- Fails on `5xx` or crash-like responses
- Writes `testing/results/api-smoke.json`

### `npm run test:ui`

- Starts admin and API if needed
- Logs into admin in Playwright
- Visits discovered admin pages
- Clicks safe buttons and fills forms
- Captures:
  - console errors
  - page crashes
  - request failures
  - `4xx/5xx` same-origin responses
- Writes:
  - `testing/results/admin-crawl-summary.json`
  - `testing/results/playwright-report/`

### `npm run test:mobile`

- Runs Flutter integration tests with local API URL
- Verifies app startup and route navigation
- Taps visible controls
- Fails on runtime exceptions

## Expected Outputs

### Success

- Terminal ends with:
  - `Database validation passed.`
  - `API smoke tests passed.`
  - `Flutter integration tests passed.`
  - `All local test suites passed.`

### Failure Detection

Treat the run as failed when any of the following happens:

- `npm run db:validate` exits non-zero
- `testing/results/api-smoke.json` contains failed checks
- Playwright reports console errors, page errors, or request failures
- Flutter integration tests throw exceptions
- API or admin never become ready on their local URLs

## Logs and Reports

After a full run, inspect:

```text
testing/results/db-validation.json
testing/results/api-smoke.json
testing/results/admin-crawl-summary.json
testing/results/playwright-report/index.html
testing/results/logs/api.stdout.log
testing/results/logs/api.stderr.log
testing/results/logs/admin.stdout.log
testing/results/logs/admin.stderr.log
```

## Seeded Accounts Used By Automation

```text
Admin:   admin@eduplatform.local / Admin@123
Teacher: teacher@eduplatform.local / Teacher@123
Student: student@eduplatform.local / Student@123
Parent:  parent@eduplatform.local / Parent@123
```
