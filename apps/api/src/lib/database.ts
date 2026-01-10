// apps/api/src/lib/database.ts
// Local database configuration for API
// This avoids TypeScript rootDir issues

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
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

// Mock database implementation for now
// In production, this would connect to real PostgreSQL
export class DatabaseService {
  static async createLesson(data: any): Promise<DatabaseLesson> {
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

  static async findLessons(where: any): Promise<DatabaseLesson[]> {
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

  static async createExam(data: any): Promise<DatabaseExam> {
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

  static async findExams(where: any): Promise<DatabaseExam[]> {
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

  // Mock school methods
  static school = {
    findMany: async (options?: any) => {
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
    create: async (data: any) => {
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
  static quiz = {
    findMany: async (options?: any) => {
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
    create: async (data: any) => {
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
}

// Export a prisma-like interface for compatibility
export const prisma = DatabaseService;

// Default export for compatibility
export default DatabaseService;
