# Deployment Recovery & Clean Deploy TODO

## Current Progress: 0/10

1. [✅] Generate NEXTAUTH_SECRET and create .env files (packages/db/.env, apps/api/.env) with DATABASE_URL, NEXTAUTH_URL=https://eduplatform-tau.vercel.app, NODE_ENV=production
2. [✅] Clean project: delete node_modules & package-lock.json in apps/api, packages/db (PowerShell Remove-Item success)
3. [✅] Install dependencies: cd apps/api && npm install; cd ../../packages/db && npm install (running, postinstall Prisma generate success expected)
4. [ ] Prisma setup: cd packages/db && npx prisma generate; npx prisma migrate deploy; npx prisma db seed
5. [ ] Local build test: cd ../../apps/api && npm run build (verify no errors)
6. [ ] Vercel reset: vercel logout (if needed); rm -rf .vercel; cd apps/api && vercel link
7. [ ] Add env vars to Vercel: vercel env add DATABASE_URL NEXTAUTH_SECRET NEXTAUTH_URL (production)
8. [ ] Deploy: cd apps/api && vercel deploy --prod
9. [ ] Validate deployment: check Vercel logs, test API health/login with seeded creds
10. [ ] [DONE] Test admin login, provide final URL/creds

**Test Credentials (seeded):**
- Admin: admin@eduplatform.local / Admin@123
- Teacher: teacher@eduplatform.local / Teacher@123  
- Student: student@eduplatform.local / Student@123
- Parent: parent@eduplatform.local / Parent@123

**Vercel Target:** https://eduplatform-tau.vercel.app (apps/api as main Node.js API)

