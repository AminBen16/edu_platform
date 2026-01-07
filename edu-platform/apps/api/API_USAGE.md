# API Usage & Testing Guide

## Environment Setup

1. Copy `.env.example` to `.env` and fill in your real credentials for Supabase, OneSignal, Sentry, and NEXTAUTH_SECRET.
2. Install dependencies: `npm install`
3. Start the API: `npm run dev` (or deploy to Vercel)

## Endpoints & Sample Requests

### Auth

- **POST /auth/register**
  - `{ "name": "Test User", "email": "test@example.com", "password": "pass1234", "schoolId": "school-uuid" }`
- **POST /auth/login**
  - `{ "email": "test@example.com", "password": "pass1234", "schoolId": "school-uuid" }`

### Lessons

- **GET /lessons** (JWT required)
- **POST /lessons** (JWT, teacher/admin)
  - `{ "title": "Lesson 1", "content": "Lesson content" }`

### Exams

- **GET /exams** (JWT required)
- **POST /exams** (JWT, teacher/admin)
  - `{ "title": "Exam 1", "questions": [ ... ] }`

### Quizzes

- **GET /quizzes** (JWT required)
- **POST /quizzes** (JWT, teacher/admin)
  - `{ "title": "Quiz 1", "questions": [ ... ] }`

### Chat

- **GET /chat/threads** (JWT required)
- **POST /chat/message** (JWT required)
  - `{ "threadId": "thread-uuid", "content": "Hello" }`

### File Upload

- **POST /upload/file** (JWT required, multipart/form-data, field: `file`)

### Notifications

- **POST /notifications/send** (JWT required)
  - `{ "toUserId": "user-uuid", "title": "Notice", "message": "Hello!" }`

### Analytics

- **POST /analytics/event** (JWT required)
  - `{ "eventType": "lesson_view", "metadata": { "lessonId": "..." } }`

## Testing Checklist

- Register and login as a user for a school.
- Test all GET/POST endpoints with valid and invalid data.
- Upload a file and verify it appears in Supabase Storage.
- Send a notification and check OneSignal dashboard.
- Trigger an error and verify it appears in Sentry.
- Track an event and check analytics logs.

## Production Notes

- Use HTTPS in production.
- Set strong secrets and keys in your real `.env`.
- Monitor Sentry and OneSignal dashboards for issues and notifications.
- Review and restrict CORS as needed.

---
For further help, see GEMINI.md or contact the project maintainer.
