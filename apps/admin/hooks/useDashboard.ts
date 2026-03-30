import { useState, useEffect } from 'react';
import { api, Analytics, User, Lesson, Quiz, School } from '../lib/api';
import { useRouter } from 'next/router';

interface DashboardData {
  totalUsers: number;
  studentCount: number;
  teacherCount: number;
  totalLessons: number;
  totalQuizzes: number;
  totalClasses: number;
}

export function useDashboard(token: string | undefined) {
  const [dashboardStats, setDashboardStats] = useState<DashboardData | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const authHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  const fetchDashboardData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard overview
      const dashboardRes = await api.get('/dashboard', { headers: authHeaders });
      setDashboardStats(dashboardRes.data.stats);
      
      // Fetch school details
      const schoolDetailsRes = await api.get(`/schools/${dashboardRes.data.user.schoolId}`, {
        headers: authHeaders,
      });
      setSchool(schoolDetailsRes.data);

      // Fetch recent users (adjusting for backend changes in /users endpoint)
      // Assuming /users endpoint now returns all users for the school
      const usersRes = await api.get('/users', { headers: authHeaders });
      // Filter for latest 5 users, sorting by createdAt from newest to oldest
      const sortedUsers = usersRes.data.sort((a: User, b: User) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentUsers(sortedUsers.slice(0, 5));

      // Fetch recent lessons (adjusting for backend changes in /lessons endpoint)
      const lessonsRes = await api.get('/lessons', { headers: authHeaders });
      // Filter for latest 5 lessons, sorting by createdAt from newest to oldest
      const sortedLessons = lessonsRes.data.sort((a: Lesson, b: Lesson) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentLessons(sortedLessons.slice(0, 5));

      // Fetch recent quizzes (adjusting for backend changes in /quizzes endpoint)
      const quizzesRes = await api.get('/quizzes', { headers: authHeaders });
      // Filter for latest 5 quizzes, sorting by createdAt from newest to oldest
      const sortedQuizzes = quizzesRes.data.sort((a: Quiz, b: Quiz) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentQuizzes(sortedQuizzes.slice(0, 5));


    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Authentication failed. Please log in again.');
        router.push('/auth/login'); // Redirect to login on auth failure
      } else {
        setError('Failed to load dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]); // Re-fetch data when token changes

  const refreshData = () => {
    fetchDashboardData();
  };

  return {
    analytics: dashboardStats, // Renamed for clarity
    recentUsers,
    recentLessons,
    recentQuizzes,
    school,
    loading,
    error,
    refreshData,
  };
}
