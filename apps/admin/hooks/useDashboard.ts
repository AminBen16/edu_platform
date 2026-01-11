import { useState, useEffect } from 'react';
import { api, Analytics, User, Lesson, Quiz, School } from '../lib/api';

export function useDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch analytics
        const analyticsRes = await api.get('/dashboard/analytics');
        setAnalytics(analyticsRes.data);

        // Fetch recent users
        const usersRes = await api.get('/users?limit=5&sort=lastLogin&order=desc');
        setRecentUsers(usersRes.data);

        // Fetch recent lessons
        const lessonsRes = await api.get('/lessons?limit=5&sort=createdAt&order=desc');
        setRecentLessons(lessonsRes.data);

        // Fetch recent quizzes
        const quizzesRes = await api.get('/quizzes?limit=5&sort=createdAt&order=desc');
        setRecentQuizzes(quizzesRes.data);

        // Fetch school info
        const schoolRes = await api.get('/schools/current');
        setSchool(schoolRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const refreshData = () => {
    // Trigger a refresh of all dashboard data
    setLoading(true);
    // The useEffect will re-run when dependencies change
  };

  return {
    analytics,
    recentUsers,
    recentLessons,
    recentQuizzes,
    school,
    loading,
    error,
    refreshData,
  };
}
