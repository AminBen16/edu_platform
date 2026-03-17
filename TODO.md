# Admin UI Deployment for Production Monitoring

## Status
- [x] Plan approved by user
- [ ] API config updated
- [ ] Vercel CLI checked/installed
- [ ] Env vars set
- [x] Created TODO.md

## Deployment Steps
1. Update `apps/admin/lib/api.ts` with live API URL
2. `cd apps/admin`
3. `npm install` (deps: next@16+, next-auth@4, axios)
4. `vercel login` 
5. `vercel` (links project)
6. `vercel env add DATABASE_URL production` (shared w/API)
7. `vercel env add NEXTAUTH_SECRET production`
8. `vercel env add NEXTAUTH_URL`
9. `vercel env add NEXT_PUBLIC_API_URL https://edu-platform-three-sable.vercel.app/api/v1`
10. `vercel --prod`
11. Test: Login as admin → Analytics/Users/Classes

**Notes:**
- vercel.json: {\"buildCommand\":\"npm run build\",\"outputDirectory\":\".next\"}
- DB: Same as API Prisma.
- Auth: NextAuth calls API backend.

**Progress:** Step 1 next.

