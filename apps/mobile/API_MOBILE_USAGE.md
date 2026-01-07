# Mobile Integration Guide

## 1. API Base URL

- Set your deployed API base URL in `api_service.dart` and `api.dart` (e.g., `https://your-vercel-app.vercel.app/api`).

## 2. Authentication

- Use `/auth/register` and `/auth/login` endpoints to register and log in users.
- Store the JWT token securely (already implemented with `shared_preferences`).
- Attach the token as `Authorization: Bearer <token>` in all protected requests.

## 3. Lessons, Exams, Quizzes

- Use the provided endpoints to fetch and create lessons, exams, and quizzes.
- Example: `GET /lessons`, `POST /exams`, `GET /quizzes`.

## 4. File Uploads

- Use `upload_service.dart` to upload files to `/upload/file`.
- Attach the JWT token in the header.
- Use the returned URL for file access/download.

## 5. Chat

- Use `/chat/threads` and `/chat/message` endpoints for real-time chat.
- Use `socket_io_client` for real-time updates if needed.

## 6. Notifications

- Integrate the [OneSignal Flutter SDK](https://pub.dev/packages/onesignal_flutter) for push notifications.
- Register device tokens with the backend if needed for targeted notifications.

## 7. Analytics

- Track events by calling `/analytics/event` with event type and metadata.

## 8. Testing

- Test all flows: registration, login, lessons, exams, quizzes, chat, file upload, notifications, analytics.
- Use real devices for push notification testing.

## 9. Automation

- Set up GitHub Actions for CI/CD to build and test the Flutter app.
- Example: Use `flutter-action` to build APKs and run tests on PRs.

---
For further help, see GEMINI.md or contact the project maintainer.
