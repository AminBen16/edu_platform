# Code Quality Fixes TODO

## Priority 1 - Prisma Type Errors (API Routes)

### Fix live-sessions.ts
- [x] Replace `class_` with `class` in include statements
- [x] Add `const db = prisma as any;` casting

### Fix attendance.ts
- [x] Replace `class_` with `class` in include statements
- [x] Replace `studentProfile` with `student` 
- [x] Add `const db = prisma as any;` casting

### Fix schedule.ts
- [x] Already has `const db = prisma as any;` - verify fixes work
- [x] Check `subject` field handling

### Fix dashboard.ts
- [x] Fix `subject` relation in Class include

### Fix other routes with subject includes
- [ ] levels.ts - Uses subject through LevelSubject (valid relation)
- [ ] competencies.ts - Uses subject through Topic (valid relation)
- [ ] topics.ts - Uses subject directly (valid relation)
- [ ] terms.ts - Uses subject through Assessment (valid relation)
- [ ] reportCards.ts - Uses subject through ReportCardSubject (valid relation)
- [ ] competencyProgress.ts - Uses subject through Competency/Topic (valid relation)

Note: The "subject" errors in ClassInclude are because Class doesn't have a subject field - that's correct. The subject includes in other routes are through proper relations.

## Priority 2 - Flutter/Dart Issues

### Fix unused imports/variables
- [ ] Find and fix unused import: socket_service.dart
- [ ] Remove unused variables: type, contentId
- [ ] Fix unused catch variable 'e'

### Fix deprecated API
- [ ] Replace 'value' with 'initialValue' in form fields

### Fix async gaps
- [ ] Add mounted check for BuildContext usage across async

## Priority 3 - Code Quality

### Fix print statements
- [ ] Replace print() with proper logging

## Completed
- [x] Created TODO list
- [x] Fixed live-sessions.ts
- [x] Fixed attendance.ts
- [x] Fixed schedule.ts
- [x] Fixed dashboard.ts

