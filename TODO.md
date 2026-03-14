# Production Validation TODO

## Current Status (Updated)
- [x] Repository scan complete
- [x] TODO.md created
- [x] Architecture mapped
- [x] Prisma schema audited (excellent)
- [x] Middleware validated (auth, rate limit, security)
- [ ] Local build fixed (Windows Prisma EPERM - skip for Vercel Linux build)
- [ ] Prod API 404 fixed
- [x] Security patches 1/3: Strict JWT secret (middleware/auth.ts, routes/auth.ts)
- [ ] API fuzz testing
- [ ] Vercel redeploy
- [ ] Workflow validation

## Priority 1: Prod Deployment Status (Updated)
- Project: ainamanipro/edu_platform (not tau)
- Root / 404 (admin?)
- Test API endpoints on latest prod deployment
- Logs streaming

## Priority 2: Security Hardening
1. [x] Edit middleware/auth.ts - remove dev fallback
2. Edit middleware/security.ts - improve CSP/HSTS (done)
3. Add auditLog middleware impl if missing

## Priority 3: Testing
1. Lint: `npm run lint`
2. API fuzz with curl
3. Dev server: `npm run dev`

## Priority 4: Deploy
1. `vercel --prod`

Updated when steps complete.

