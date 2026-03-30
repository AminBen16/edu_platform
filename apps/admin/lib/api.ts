import axios from 'axios';

const BROWSER_BASE_URL = '/api/v1';
const SERVER_BASE_URL = `${(process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')}/api/v1`;

export const api = axios.create({
  baseURL: typeof window === 'undefined' ? SERVER_BASE_URL : BROWSER_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
  teacherProfile?: { 
    id: string;
  };
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: string;
  videoUrl?: string;
  duration?: number;
  order?: number;
  subjectId?: string;
  classId?: string;
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: any[];
  duration?: number;
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  principal: string;
  vicePrincipal: string;
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  academicYear: string;
  semester: string;
  timezone: string;
  gradingScale: string;
  attendancePolicy: string;
  features: {
    onlineGrading: boolean;
    digitalLibrary: boolean;
    parentPortal: boolean;
    studentEmail: boolean;
    emergencyAlerts: boolean;
  };
}

export interface Analytics {
  totalUsers: number;
  activeUsers: number;
  totalLessons: number;
  publishedLessons: number;
  totalQuizzes: number;
  publishedQuizzes: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    userId?: string;
    userName?: string;
  }>;
}

