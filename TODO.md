# Fix CORS, Favicon, and Dashboard Errors

## Plan Steps:
- [ ] 1. Copy favicon.png from apps/mobile/web → apps/admin/public/favicon.ico
- [ ] 2. Edit apps/admin/public/index.html: Change fetch('/dashboard/analytics') → fetch('/dashboard')
- [ ] 3. Edit apps/api/src/index.ts: Update CORS to allow admin URL + env fallback
- [ ] 4. Add Vercel headers to vercel.json (optional redundancy)
- [ ] 5. Test locally
- [ ] 6. Redeploy both API and Admin to Vercel
- [ ] 7. Verify fixes: No 404s, CORS passes, dashboard data loads

## Root Causes Fixed:
1. Missing `/api/v1/dashboard/analytics` endpoint (wrong URL in static HTML)
2. CORS blocks admin → API (missing origin in production)
3. Favicon 404 (missing file)

**Next**: Starting with favicon copy...

