"use strict";
// apps/api/src/lib/database.ts
// Local database configuration for API
// This avoids TypeScript rootDir issues
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.DatabaseService = exports.AuditLogAction = exports.Role = void 0;
var Role;
(function (Role) {
    Role["SUPER_ADMIN"] = "SUPER_ADMIN";
    Role["ADMIN"] = "ADMIN";
    Role["TEACHER"] = "TEACHER";
    Role["STUDENT"] = "STUDENT";
    Role["PARENT"] = "PARENT";
    Role["SCHOOL_ADMIN"] = "SCHOOL_ADMIN";
})(Role || (exports.Role = Role = {}));
var AuditLogAction;
(function (AuditLogAction) {
    AuditLogAction["USER_LOGIN"] = "USER_LOGIN";
    AuditLogAction["LESSON_VIEWED"] = "LESSON_VIEWED";
    AuditLogAction["QUIZ_ATTEMPTED"] = "QUIZ_ATTEMPTED";
})(AuditLogAction || (exports.AuditLogAction = AuditLogAction = {}));
// Mock database implementation for now
// In production, this would connect to real PostgreSQL
class DatabaseService {
    static async createLesson(data) {
        // Mock implementation
        return {
            id: `lesson-${Date.now()}`,
            title: data.title,
            description: data.description,
            topicId: data.topicId,
            schoolId: data.schoolId,
            authorId: data.authorId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    static async findLessons(where) {
        // Mock implementation
        return [
            {
                id: '1',
                title: 'Introduction to Mathematics',
                description: 'Basic concepts and fundamentals of mathematics',
                content: 'This lesson covers numbers, basic operations, and introductory algebra.',
                topicId: 'math-101',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ];
    }
    static async createExam(data) {
        // Mock implementation
        return {
            id: `exam-${Date.now()}`,
            title: data.title,
            questions: data.questions,
            duration: data.duration || 60,
            lessonId: data.lessonId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
    static async findExams(where) {
        // Mock implementation
        return [
            {
                id: '1',
                title: 'Mathematics Final Exam',
                description: 'Comprehensive assessment covering all topics from the semester',
                questions: [
                    {
                        id: 'q1',
                        question: 'What is 2 + 2?',
                        options: ['3', '4', '5', '2'],
                        correctAnswer: 1,
                    }
                ],
                duration: 60,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ];
    }
}
exports.DatabaseService = DatabaseService;
_a = DatabaseService;
// Mock school methods
DatabaseService.school = {
    findMany: async (options) => {
        return [
            {
                id: 'default-school',
                name: 'Default Education Platform',
                logoUrl: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
        ];
    },
    create: async (data) => {
        return {
            id: `school-${Date.now()}`,
            name: data.name,
            logoUrl: data.logoUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
};
// Mock quiz methods
DatabaseService.quiz = {
    findMany: async (options) => {
        return [
            {
                id: '1',
                title: 'Mathematics Final Exam',
                description: 'Comprehensive assessment covering all topics from the semester',
                questions: [
                    {
                        id: 'q1',
                        question: 'What is 2 + 2?',
                        options: ['3', '4', '5', '2'],
                        correctAnswer: 1,
                    }
                ],
                duration: 60,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
        ];
    },
    create: async (data) => {
        return {
            id: `quiz-${Date.now()}`,
            title: data.title,
            questions: data.questions,
            duration: data.duration || 60,
            lessonId: data.lessonId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
};
// Export a prisma-like interface for compatibility
exports.prisma = DatabaseService;
// Default export for compatibility
exports.default = DatabaseService;
