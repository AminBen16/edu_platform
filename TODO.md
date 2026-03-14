# Vercel API Deployment Fix
## Steps:
1. [x] Create apps/api/vercel.json with @vercel/node builder for Express API
2. [x] Updated apps/api/vercel.json - root unchanged as project-specific config used
3. [x] Handle Prisma prebuild (generate client during build)
4. [ ] Commit and push to trigger redeploy: git add . && git commit -m "fix: vercel api deployment config" && git push
5. [ ] Verify deployment and test endpoints
6. [ ] Update Prisma to latest
7. [ ] Mark complete

