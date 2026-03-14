# Vercel API Build Fix - TODO Steps

## Plan Implementation Steps (Approved)

### 1. [x] Update packages/db/package.json (ensure postinstall prisma generate)
### 2. [x] Update apps/api/package.json (add db build to build script)
### 3. [x] Update apps/api/tsconfig.json (add paths and project references for db)
### 4. [x] Create/Update apps/api/src/types/db.d.ts (merge prisma types for db module)
### 5. [x] Test local build: cd apps/api && npm install && npm run build (tsc succeeds)
### 6. [x] Update vercel.json if needed (build overrides - not needed, prebuild works)
### 7. [ ] Commit changes with message "fix: resolve vercel api build tsc hang"
### 8. [ ] Push and trigger Vercel redeploy
### 9. [ ] Verify build success and API endpoints

**Current Progress: Starting implementation**

*Updated: After each step completed*
