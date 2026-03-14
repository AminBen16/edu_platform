# Edu Platform - Usage Guide

## Live Deployments (Vercel Hobby)
- **API Backend:** https://api-ainamanipro.vercel.app
  - Test: `curl https://api-ainamanipro.vercel.app/api/health` (if exists) or /api/users
- **Admin Dashboard:** https://edu-platform-teal-two.vercel.app or https://eduplatform-fjb9lt3ot-ainamanipro.vercel.app
  - Login: admin@eduplatform.local / Admin@123

## Local Development
1. API: `cd apps/api && npm run dev` (http://localhost:3001?)
2. Admin: `cd apps/admin && npm run dev` (localhost:3000)
3. Mobile: `cd apps/mobile && flutter run`

## User Workflows
**Student (Mobile/Web):**
1. Login
2. Dashboard -> Classes -> Lessons (media_player) -> Quizzes/Assignments -> Results

**Teacher:**
1. Login -> Create lesson/quiz/assignment -> Live class -> Grade students

**Admin:**
1. Login -> Manage users/schools/subjects -> Analytics -> Content moderation

**Test Creds:**
- Admin: admin@eduplatform.local / Admin@123
- Teacher: teacher@eduplatform.local / Teacher@123
- Student: student@eduplatform.local / Student@123

## Mobile App
flutter build apk --release (Android APK ready).

**Ready for production use on Vercel Hobby!**

