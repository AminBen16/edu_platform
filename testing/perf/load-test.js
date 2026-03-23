
const autocannon = require('autocannon');
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m"
};

const BASE_URL = 'http://localhost:3002/api';

async function runLoadTest() {
  console.log(`${colors.cyan}🚀 Starting API Load Test (Stress Testing)${colors.reset}`);
  
  // 1. Get Auth Token first
  let token;
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@test.com', password: 'password123', schoolId: 'test-school-1' })
    });
    const data = await loginRes.json();
    token = data.token;
    if (!token) throw new Error("No token received");
  } catch (e) {
    console.error("Login failed, running unauthenticated load test.");
  }

  const instance = autocannon({
    url: `${BASE_URL}/users`,
    connections: 50, // 50 concurrent connections
    pipelining: 1,
    duration: 10, // 10 seconds
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });

  autocannon.track(instance, { renderProgressBar: true });

  instance.on('done', (result) => {
    console.log(`\n${colors.green}✔ Load Test Complete${colors.reset}`);
    console.log(`Latency Average: ${result.latency.average}ms`);
    console.log(`Req/Sec: ${result.requests.average}`);
    console.log(`Total Errors: ${result.errors}`);
    
    if (result.errors > 0 || result.timeouts > 0) {
      console.log(`${colors.red}⚠️ System struggled under load!${colors.reset}`);
      process.exit(1);
    }
  });
}

runLoadTest();
