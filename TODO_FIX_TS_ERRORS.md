// TODO: Fix API TypeScript Errors

## Phase 1: Core Middleware Fixes

- [x] 1. Fix `apps/api/src/middleware/auditLog.ts` - Add schoolId to audit log creates
- [x] 2. Fix `apps/api/src/middleware/rateLimit.ts` - Add schoolId to rate limit operations

## Phase 2: Route Fixes

- [x] 3. Fix `apps/api/src/routes/assignments.ts` - Add schoolId to assignment and submission create
- [x] 4. Fix `apps/api/src/routes/chat.ts` - Add schoolId to message create
- [x] 5. Fix `apps/api/src/routes/files.ts` - Add schoolId to lessonResource create
- [x] 6. Fix `apps/api/src/routes/levels.ts` - Fix schoolId filter (use curriculum relation)
- [x] 7. Fix `apps/api/src/routes/quizzes.ts` - Add schoolId to question/option/quizAttempt/answer creates
- [x] 8. Fix `apps/api/src/routes/attendance.ts` - Fix unique constraint and field references
- [x] 9. Fix `apps/api/src/routes/terms.ts` - Fix _count select syntax

## Phase 3: Verification

- [x] 10. Run TypeScript check to verify all errors are fixed

## Summary

Fixed 21 TypeScript errors in the API:
- **attendance.ts**: Replaced upsert with findFirst + create/update pattern to handle unique constraint correctly
- **terms.ts**: Removed invalid _count select syntax, using separate count query instead

