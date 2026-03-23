
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3002/api';
const ADMIN_EMAIL = 'admin@test.com';
const ADMIN_PASSWORD = 'password123';

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

async function testEndpoint(method, path, options = {}) {
  const { token, body, expectedStatus = 200, description } = options;
  
  process.stdout.write(`  ${colors.cyan}[${method}]${colors.reset} ${path} (${description})... `);
  
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === expectedStatus) {
      const data = await res.json().catch(() => ({}));
      console.log(`${colors.green}✔ OK (${res.status})${colors.reset}`);
      return { ok: true, data };
    } else {
      console.log(`${colors.red}❌ FAILED (Expected ${expectedStatus}, got ${res.status})${colors.reset}`);
      return { ok: false, status: res.status };
    }
  } catch (error) {
    console.log(`${colors.red}❌ ERROR: ${error.message}${colors.reset}`);
    return { ok: false, error: error.message };
  }
}

async function run() {
  console.log(`${colors.cyan}--- Enhanced Backend API Tests ---${colors.reset}\n`);

  // 1. Auth & Login
  const loginResult = await testEndpoint('POST', '/auth/login', {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, schoolId: 'test-school-1' },
    description: 'Admin Login',
  });
  
  if (!loginResult.ok) process.exit(1);
  const token = loginResult.data.token;

  // 2. Security Tests (Unauthorized)
  console.log(`\n${colors.yellow}Security Verification:${colors.reset}`);
  await testEndpoint('GET', '/users', { 
    expectedStatus: 401, 
    description: 'Unauthorized access (No Token)' 
  });

  // 3. Functional Tests with Data Validation
  console.log(`\n${colors.yellow}Functional Verification:${colors.reset}`);
  
  // Test User Listing structure
  const usersRes = await testEndpoint('GET', '/users', { 
    token, 
    description: 'List Users' 
  });
  if (usersRes.ok && Array.isArray(usersRes.data)) {
    const firstUser = usersRes.data[0];
    if (firstUser && firstUser.email && firstUser.role) {
      console.log(`    ${colors.green}✔ Schema valid: Found user ${firstUser.email}${colors.reset}`);
    }
  }

  // Test Invite (Edge Case: Invalid Email)
  await testEndpoint('POST', '/auth/invite', {
    token,
    body: { email: 'invalid-email', name: 'Test', role: 'STUDENT', schoolId: 'test-school-1' },
    expectedStatus: 400,
    description: 'Invite with invalid email'
  });

  // Test Create Resource (Lesson)
  const lessonRes = await testEndpoint('POST', '/lessons', {
    token,
    body: { title: 'API Test Lesson', content: 'Testing content', schoolId: 'test-school-1' },
    expectedStatus: 201,
    description: 'Create Lesson'
  });

  if (lessonRes.ok) {
    const lessonId = lessonRes.data.id;
    // Test Delete
    await testEndpoint('DELETE', `/lessons/${lessonId}`, {
      token,
      expectedStatus: 200,
      description: 'Delete created lesson'
    });
  }

  console.log(`\n${colors.cyan}--- Backend Tests Complete ---${colors.reset}`);
}

run();
