// apps/api/src/lib/database.ts
// Database types and utilities for API
// Note: This file should ONLY contain types and enums, not database connections

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
}

export enum AuditLogAction {
  USER_LOGIN = 'USER_LOGIN',
  LESSON_VIEWED = 'LESSON_VIEWED',
  QUIZ_ATTEMPTED = 'QUIZ_ATTEMPTED',
}

export interface DatabaseUser {
  id: string;
  email: string;
  role: Role;
  schoolId: string;
  name?: string;
  avatarUrl?: string;
}

export interface DatabaseLesson {
  id: string;
  title: string;
  description: string;
  content?: string;
  topicId: string;
  schoolId?: string;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseExam {
  id: string;
  title: string;
  description?: string;
  questions: any[];
  duration: number;
  lessonId?: string;
  schoolId?: string;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchool {
  id: string;
  name: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}
