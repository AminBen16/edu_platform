# Code Quality Patch Implementation Plan

## Summary
This patch applies code quality improvements to the edu_platform API, including:
1. Adding proper TypeScript type annotations to callback functions
2. Adding type guards for filtering
3. Adding role-based authorization checks for notifications
4. Removing mock/fallback code in notifications
5. Using AuthenticatedUser type instead of Prisma User type

## Files to Modify

### 1. apps/api/src/middleware/auth.ts
- Import `AuthenticatedUser` from `../types/auth`
- Import `Role` from `../lib/database`
- Replace `User` type with `AuthenticatedUser` in Request augmentation
- Use `Role` type in authorize function

### 2. apps/api/src/middleware/auditLog.ts
- Remove import of `User` from `@prisma/client`
- Use simple `{ id: string }` type instead of `User` in logSecurityEvent

### 3. apps/api/src/routes/analytics.ts
- Add type annotation: `(u: { id: string }) => u.id` in map callback
- Add type annotation: `(user: any)` in userAnalytics map

### 4. apps/api/src/routes/analyticsRoutes.ts
- Add type annotation: `(user: any)` in userAnalytics map
- Add type annotations to reduce callbacks: `(sum: number, e: any)` and `(sum: number, qa: any)`

### 5. apps/api/src/routes/assignments.ts
- Import `Role` from `../lib/database`
- Add type annotation: `(e: { classId: string | null })` in map
- Add type guard: `.filter((id: string | null): id is string => id !== null)`

### 6. apps/api/src/routes/auth.ts
- Add type annotation: `(u: any)` in find callback for multi-account resolution

### 7. apps/api/src/routes/content.ts
- Import `Role` from `../lib/database`
- Add type annotation: `(item: any)` in map callbacks

### 8. apps/api/src/routes/dashboard.ts
- Import `Role` from `../lib/database`
- Add type annotations to map, filter, and reduce callbacks

### 9. apps/api/src/routes/files.ts
- Import `Role` from `../lib/database`
- Add type annotation: `(l: { id: string })` in map
- Add type annotations to student enrollment map/filter

### 10. apps/api/src/routes/notifications.ts (Major Changes)
- Import `Role` from `../lib/database`
- Remove mockNotifications array
- Remove all mock/fallback code blocks
- Add rolesAllowedToSendNotifications array
- Add hasDatabase check
- Add canSendNotifications function
- Add authorization checks before sending notifications
- Add validation for recipients array
- Add schoolId to all database queries for security

### 11. apps/api/src/routes/quizzes.ts
- Add type annotations: `(answer: any)` in map
- Add type annotations: `(q: any)` in find callbacks
- Add filter with type guard: `.filter(a => a !== null)`

## Implementation Order
1. middleware/auth.ts
2. middleware/auditLog.ts
3. routes/analytics.ts
4. routes/analyticsRoutes.ts
5. routes/assignments.ts
6. routes/auth.ts
7. routes/content.ts
8. routes/dashboard.ts
9. routes/files.ts
10. routes/notifications.ts (most complex)
11. routes/quizzes.ts

## Testing
After applying changes, run:
- TypeScript compilation: `cd apps/api && npx tsc --noEmit`
- Run tests if available

