# TODO: Fix TypeScript Build Errors

## Issues Identified from Build Log:

### 1. PrismaClient Type Errors (Critical)
- `packages/db/lib/prisma.ts` - PrismaClient only refers to type
- `apps/api/src/routes/analyticsRoutes.ts` - PrismaClient type error
- Root cause: Prisma client not generated during build

### 2. Implicit 'any' Type Errors
- `live-sessions.ts(45,47)` - session parameter
- `dashboard.ts` - Multiple parameters (cls, sum, c, a, attempt, child)
- `reports.ts` - l, a parameters
- `attendance.ts` - a, s, c, record parameters + property access errors
- `subjects.ts` - ls, subject parameters

## Fix Plan:

### Step 1: Fix Prisma Setup ✅
- [x] 1.1 Update packages/db/package.json to include prisma generate in build
- [x] 1.2 Create postinstall script to generate prisma client

### Step 2: Fix Type Annotations ✅
- [x] 2.1 Fix apps/api/src/routes/live-sessions.ts
- [x] 2.2 Fix apps/api/src/routes/dashboard.ts
- [x] 2.3 Fix apps/api/src/routes/reports.ts
- [x] 2.4 Fix apps/api/src/routes/attendance.ts
- [x] 2.5 Fix apps/api/src/routes/subjects.ts
- [x] 2.6 Fix apps/api/src/routes/analyticsRoutes.ts

### Step 3: Test Build
- [ ] 3.1 Run local build to verify fixes
- [ ] 3.2 Push changes to trigger new deployment

## Summary of Changes Made:

1. **packages/db/package.json**: Added `prisma:generate` and `postinstall` scripts
2. **apps/api/src/routes/analyticsRoutes.ts**: Changed PrismaClient import to use shared prisma instance
3. **apps/api/src/routes/live-sessions.ts**: Added `any` type to session.map callback
4. **apps/api/src/routes/dashboard.ts**: Added type annotations to map callbacks and reduce functions
5. **apps/api/src/routes/attendance.ts**: Added type annotations and fixed property access with optional chaining
6. **apps/api/src/routes/subjects.ts**: Added type annotations to map callbacks
7. **apps/api/src/routes/reports.ts**: Added type annotations to filter callback

