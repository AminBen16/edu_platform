
const BASE_URL = 'http://localhost:3002/api';
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  reset: "\x1b[0m"
};

// SQL Injection payloads
const FUZZ_STRINGS = [
  "' OR '1'='1",
  "; DROP TABLE users;",
  "<script>alert(1)</script>",
  "admin' --",
  "UNION SELECT 1,2,3--"
];

async function runSecurityScan() {
  console.log("🛡️ Starting Security Fuzzing...");

  // 1. Public Endpoint Fuzzing
  for (const payload of FUZZ_STRINGS) {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payload, password: 'password123' })
      });
      
      if (res.status === 500) {
        console.log(`${colors.red}❌ POTENTIAL VULNERABILITY: 500 Error on payload: ${payload}${colors.reset}`);
      } else {
        process.stdout.write('.');
      }
    } catch (e) {
      console.error(e);
    }
  }
  
  console.log(`\n${colors.green}✔ Fuzzing Complete (Basic)${colors.reset}`);
}

runSecurityScan();
