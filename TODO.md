# Vercel Deployment TODO

## 1. [✅] Preparation
- [✅] Install dependencies: npm install
- [✅] Build packages/db: npm run build:packages
- [✅] Build API: npm run build:api
- [✅] Build Admin: npm run build:admin

## 2. [✅] Vercel CLI Setup
- [✅] Check Vercel CLI: vercel --version
- [✅] Login: vercel login

## 3. [✅] Deploy API (Root)
- [✅] vercel --prod (https://eduplatform-fjb9lt3ot-ainamanipro.vercel.app)

## 4. [ ] Deploy Admin
- [ ] cd apps/admin && vercel --prod

## 5. [ ] Test Endpoints
- [ ] Test API endpoints (list below)
- [ ] Test Admin pages

## 6. [ ] Post-Deployment
- [ ] Update env vars if needed
- [ ] Verify integration

**API Endpoints to test:**
- POST /api/auth/register
- POST /api/auth/login
- GET /api/users
- GET /api/dashboard
- GET /api/lessons
- GET /api/quizzes
- GET /api/analytics
- GET /api/live-sessions

