import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { getSession } from 'next-auth/react';
import type { GetServerSidePropsContext } from 'next';

interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  subjectId?: string;
  teacherId?: string;
  isPublished: boolean;
  timeLimit?: number;
  passingScore?: number;
  maxScore: number;
  createdAt: string;
  updatedAt: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  points: number;
}

interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  color?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function QuizzesPage() {
  const { isAuthenticated } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newQuiz, setNewQuiz] = useState({
    title: '',
    subjectId: '',
    timeLimit: 30,
    passingScore: 70,
    maxScore: 100,
    isPublished: false,
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion>({
    id: '',
    question: '',
    type: 'multiple_choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 10,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [quizzesResponse, subjectsResponse, usersResponse] = await Promise.all([
        api.get('/quizzes'),
        api.get('/subjects'),
        api.get('/users')
      ]);
      
      setQuizzes(quizzesResponse.data);
      setSubjects(subjectsResponse.data);
      setTeachers(usersResponse.data.filter((user: User) => user.role === 'TEACHER'));
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuiz.title || !newQuiz.subjectId || questions.length === 0) return;

    try {
      setCreating(true);
      setError('');
      
      const quizData = {
        ...newQuiz,
        questions: questions.map((q, index) => ({
          ...q,
          id: `q-${index}`,
        })),
      };
      
      await api.post('/quizzes', quizData);

      setShowCreateModal(false);
      setNewQuiz({
        title: '',
        subjectId: '',
        timeLimit: 30,
        passingScore: 70,
        maxScore: 100,
        isPublished: false,
      });
      setQuestions([]);
      setCurrentQuestion({
        id: '',
        question: '',
        type: 'multiple_choice',
        options: ['', '', '', ''],
        correctAnswer: '',
        points: 10,
      });
      await loadData();
    } catch (err) {
      setError('Failed to create quiz');
    } finally {
      setCreating(false);
    }
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.question || !currentQuestion.correctAnswer) return;
    
    setQuestions([...questions, { ...currentQuestion, id: `q-${Date.now()}` }]);
    setCurrentQuestion({
      id: '',
      question: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 10,
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handlePublishQuiz = async (quizId: string) => {
    try {
      await api.put(`/quizzes/${quizId}`, { isPublished: true });
      await loadData();
    } catch (err) {
      setError('Failed to publish quiz');
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;

    try {
      await api.delete(`/quizzes/${quizId}`);
      await loadData();
    } catch (err) {
      setError('Failed to delete quiz');
    }
  };

  const handleDownloadQuiz = async (quizId: string, quizTitle: string) => {
    try {
      const response = await api.get(`/download/quiz/${quizId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quizTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download quiz');
    }
  };

  if (loading) {
    return (
      <main style={{ padding: '2rem' }}>
        <h1>Manage Quizzes</h1>
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Manage Quizzes</h1>
          <p>Create assessments and track student progress with detailed analytics.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          + Create Quiz
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => setError(null)} />}

      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem' }}>
        {quizzes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
            <h3>No quizzes yet</h3>
            <p>Click "Create Quiz" to create your first assessment</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr)', gap: '1rem' }}>
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                style={{
                  border: '1px solid #e1e8ed',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#f39c12',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      marginRight: '0.75rem',
                    }}
                  >
                    📝
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{quiz.title}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: quiz.isPublished ? '#28a745' : '#ffc107',
                        color: quiz.isPublished ? 'white' : '#856404',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                      }}>
                        {quiz.isPublished ? 'Published' : 'Draft'}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                      }}>
                        {quiz.questions?.length || 0} questions
                      </span>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#6f42c1',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                      }}>
                        {quiz.maxScore} points
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {quiz.subjectId && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                      }}>
                        {subjects.find(s => s.id === quiz.subjectId)?.name || 'No Subject'}
                      </span>
                    )}
                    {quiz.timeLimit && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                      }}>
                        {quiz.timeLimit} min
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleDownloadQuiz(quiz.id, quiz.title)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handlePublishQuiz(quiz.id)}
                      disabled={quiz.isPublished}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: quiz.isPublished ? '#6c757d' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: quiz.isPublished ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {quiz.isPublished ? 'Published' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ marginBottom: '1rem' }}>Create New Quiz</h2>
            <form onSubmit={handleCreateQuiz}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Quiz Title</label>
                  <input
                    type="text"
                    value={newQuiz.title}
                    onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                    placeholder="e.g., Mathematics Midterm Exam"
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Subject</label>
                  <select
                    value={newQuiz.subjectId}
                    aria-label="Subject"
                    onChange={(e) => setNewQuiz({ ...newQuiz, subjectId: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Time Limit (minutes)</label>
                  <input
                    type="number"
                    aria-label="Time Limit"
                    value={newQuiz.timeLimit}
                    onChange={(e) => setNewQuiz({ ...newQuiz, timeLimit: parseInt(e.target.value, 10) || 30 })}
                    min="5"
                    max="180"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Passing Score (%)</label>
                  <input
                    type="number"
                    aria-label="Passing Score"
                    value={newQuiz.passingScore}
                    onChange={(e) => setNewQuiz({ ...newQuiz, passingScore: parseInt(e.target.value, 10) || 70 })}
                    min="0"
                    max="100"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Max Score</label>
                  <input
                    type="number"
                    aria-label="Max Score"
                    value={newQuiz.maxScore}
                    onChange={(e) => setNewQuiz({ ...newQuiz, maxScore: parseInt(e.target.value, 10) || 100 })}
                    min="1"
                    max="1000"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1rem' }}>Add Questions</h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Question</label>
                  <textarea
                    value={currentQuestion.question}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                    placeholder="Enter your question here"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      resize: 'vertical',
                    }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Question Type</label>
                    <select
                      value={currentQuestion.type}
                      aria-label="Question Type"
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value as QuizQuestion['type'] })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True/False</option>
                      <option value="short_answer">Short Answer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Points</label>
                    <input
                      type="number"
                      aria-label="Points"
                      value={currentQuestion.points}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value, 10) || 10 })}
                      min="1"
                      max="100"
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
                
                {currentQuestion.type === 'multiple_choice' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Options (one per line)</label>
                    <textarea
                      value={currentQuestion.options?.join('\n') || ''}
                      onChange={(e) => setCurrentQuestion({ 
                        ...currentQuestion, 
                        options: e.target.value.split('\n').filter(o => o.trim()) 
                      })}
                      placeholder="Option 1&#10;Option 2&#10;Option 3&#10;Option 4"
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                )}
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Correct Answer</label>
                  <input
                    type="text"
                    value={currentQuestion.correctAnswer}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                    placeholder={currentQuestion.type === 'multiple_choice' ? 'Enter the correct option' : 'Enter the correct answer'}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }}
                  />
                </div>
                
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Add Question
                </button>
              </div>
              
              {questions.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>Questions Added ({questions.length})</h4>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {questions.map((q, index) => (
                      <div key={q.id} style={{
                        padding: '0.5rem',
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div>
                          <strong>{index + 1}. {q.question}</strong>
                          <div style={{ fontSize: '0.875rem', color: '#666' }}>
                            {q.type} • {q.points} points
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(index)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || questions.length === 0}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: creating || questions.length === 0 ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: creating || questions.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {creating ? 'Creating...' : `Create Quiz (${questions.length} questions)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/api/auth/signin', // Or your custom login page
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
