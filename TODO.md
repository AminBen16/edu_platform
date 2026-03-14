# Fix Production CORS/404 Errors - Dashboard Analytics
Automated fixes for root cause in demo landing page.

## Steps (3/5 complete)

### [x] 1. Update apps/admin/public/index.html
✅ Fixed hardcoded preview API URL to relative `/api/v1/` and corrected endpoints
- Fix hardcoded preview API URL
- Correct endpoint path: `/api/v1/dashboard/analytics` → `/api/v1/analytics/dashboard`
- Use relative `/api/v1/` leveraging Vercel proxy if possible

### [x] 2. Verify backend endpoint
✅ Confirmed: `apps/api/src/routes/analyticsRoutes.ts` has `GET /dashboard` (protect middleware, real Prisma queries, returns totalStudents/teachers/lessons/quizzes/recentActivity)

### [x] 3. Test locally
✅ Added apps/admin/vercel.json for Next.js output dir (.next). Test: `cd apps/admin && npm run dev`, verify Network tab fetches /api/v1/analytics/dashboard OK

### [ ] 4. Deploy to Vercel
- `vercel --prod`
- Test production URLs

### [ ] 5. Verify & complete
- No more 404/CORS errors
- Mark complete
