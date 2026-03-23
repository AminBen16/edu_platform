import request from 'supertest';
import { execSync } from 'child_process';

const appUrl = 'http://localhost:3001';

// Login helper
const login = async (email: string, password: string): Promise<string> => {
  const res = await request(appUrl)
    .post('/api/auth/login')
    .send({ email, password, schoolId: 'test-school-1' });
  expect(res.status).toBe(200);
  return res.body.token;
};

describe('API Health & Core Endpoints', () => {
  beforeAll(() => {
    // Ensure DB seeded
    execSync('tsx ../seed.ts', { cwd: './backend', stdio: 'inherit' });
  });

  test('Health check', async () => {
    const res = await request(appUrl).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy ✅');
  });

  test('Auth login', async () => {
    await login('admin@test.com', 'password123');
  });

  test('CRUD Sample: Classes (auth)', async () => {
    const token = await login('admin@test.com', 'password123');
    const createRes = await request(appUrl)
      .post('/api/classes')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E Test Class' });
    expect(createRes.status).toBe(201);

    const listRes = await request(appUrl)
      .get('/api/classes')
      .set('Authorization', `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBeGreaterThan(0);
  });

  test('Assignments/Quizzes/Lessons access', async () => {
    const token = await login('teacher@test.com', 'password123');
    // GET lists (common pattern)
    const endpoints = ['/api/assignments', '/api/quizzes', '/api/lessons'];
    for (const endpoint of endpoints) {
      const res = await request(appUrl)
        .get(endpoint)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    }
  });

  test('Error cases: Invalid auth', async () => {
    const res = await request(appUrl)
      .get('/api/users')
      .set('Authorization', 'Bearer invalid');
    expect(res.status).toBe(401);
  });
});
