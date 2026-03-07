# Deployment Readiness Checklist

## Phase 0: Discovery Complete ✅

### Repository Status
- **Branch**: main (3 commits ahead of origin/main)
- **Remote**: https://github.com/AminBen16/edu_platform.git
- **Git Status**: Clean (only untracked TODO_PATCH.md)

### Project Structure Verified ✅
- **Admin App**: Next.js 14.2.3 with NextAuth
- **API**: Express + TypeScript + Prisma  
- **Mobile**: Flutter (separate deployment)
- **Database**: PostgreSQL schema with Prisma ORM
- **Storage**: Supabase configured

### Configuration Files ✅
- `vercel.json` - Configured for API + Admin
- `packages/db/schema.prisma` - Multi-tenant schema with schoolId
- `apps/api/src/index.ts` - Express server with all routes
- `apps/admin/next.config.js` - Next.js production config

---

## Phase 1: Local Build Status

### Admin App Build
- [x] TypeScript check: PASSING
- [ ] Build: IN PROGRESS

### API Build  
- [ ] TypeScript check: 21 ERRORS (need fixing)
  - Missing schoolId in various routes
  - Missing relations in Prisma creates
  - Schema mismatch issues

### Prisma Status ✅
- [x] Prisma Client Generated: v5.22.0

---

## Phase 2: Production Config Required

### Environment Variables Needed
- [ ] `DATABASE_URL` - Neon Postgres connection string
- [ ] `NEXTAUTH_SECRET` - JWT signing secret
- [ ] `NEXTAUTH_URL` - Production URL
- [ ] `NEXT_PUBLIC_API_URL` - API production URL
- [ ] `ALLOWED_ORIGINS` - CORS origins
- [ ] `SENTRY_DSN` - Optional (error tracking)
- [ ] `SUPABASE_URL` - For file storage
- [ ] `SUPABASE_KEY` - For file storage

### Vercel Project Setup
- [ ] Connect GitHub repo to Vercel
- [ ] Configure environment variables
- [ ] Set up builds for API and Admin

---

## Phase 3: Known Issues to Fix

### API TypeScript Errors (21 total)
1. `auditLog.ts` - Missing schoolId
2. `rateLimit.ts` - Missing school relation
3. `assignments.ts` - Missing schoolId in creates
4. `attendance.ts` - Schema mismatch (9 errors)
5. `chat.ts` - Missing schoolId
6. `files.ts` - Missing school/lesson relations
7. `levels.ts` - schoolId filter issue (4 errors)
8. `quizzes.ts` - Missing schoolId
9. `terms.ts` - Count select issue

---

## Deployment Plan

### Step 1: Fix API TypeScript Errors
- Add missing schoolId to all create operations
- Fix attendance route schema issues
- Fix levels route where clause

### Step 2: Set Up Neon Database
- Create Neon project
- Get connection string
- Run migrations

### Step 3: Deploy to Vercel
- Connect repo
- Set environment variables
- Deploy API and Admin

### Step 4: Seed Production
- Run seed script
- Create test admin user

### Step 5: Validate
- Test login
- Test CRUD operations
- Verify multi-tenancy

---

## Success Criteria Tracking

- [ ] Admin app builds and deploys
- [ ] API builds and deploys  
- [ ] Database migrations applied
- [ ] Login works
- [ ] Can create lessons/quizzes/assignments
- [ ] Can submit student work
- [ ] Notifications work
- [ ] Health check endpoint returns 200

