import { test, expect } from '@playwright/test';
import request from 'supertest';
import { appUrl } from '../backend/test.api'; // Reuse backend logic if possible

const API_BASE = 'http://localhost:3001';

test.describe('API Smoke Tests', () => {
  test('Health & Auth endpoints', async () => {
    // Health
    const healthRes = await request(API_BASE).get('/api/health');
    expect(healthRes.status).toBe(200);

    // Login
    const loginRes = await request(API_BASE)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123', schoolId: 'test-school-1' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });
});
