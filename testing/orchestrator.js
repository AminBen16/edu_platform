
const { spawn, execSync } = require('child_process');
const path = require('path');

const API_DIR = path.resolve(__dirname, '../apps/api');
const API_PORT = 3002;

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

async function main() {
  console.log(`${colors.cyan}🚀 Launching Upgraded Test Orchestrator${colors.reset}`);

  let apiProcess;
  try {
    // 1. Start API
    console.log('Starting API server...');
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    apiProcess = spawn(npmCmd, ['run', 'dev'], { cwd: API_DIR, detached: false });

    // 2. Wait for API Health
    let ready = false;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(`http://localhost:${API_PORT}/api/health`);
        if (res.ok) { ready = true; break; }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 1000));
      process.stdout.write('.');
    }
    if (!ready) throw new Error('API failed to start');
    console.log(`\n${colors.green}✔ API Ready${colors.reset}`);

    // 3. Seed
    console.log('Seeding database...');
    execSync('npx tsx backend/seed.ts', { cwd: __dirname, stdio: 'inherit' });

    // 4. Run Backend Tests
    console.log('\nRunning Enhanced API Tests...');
    execSync('node backend/api-test.js', { cwd: __dirname, stdio: 'inherit' });

    // 5. Run Smart Crawler (Frontend)
    console.log('\nRunning Smart Frontend Crawler...');
    // We use --headed if we want to see it, or default headless
    execSync('npx playwright test frontend/smart-crawler.spec.ts', { 
      cwd: __dirname, 
      stdio: 'inherit',
      env: { ...process.env, DEBUG: 'pw:api' } // Optional debug info
    });

    console.log(`\n${colors.green}✅ ALL TEST SUITES PASSED SUCCESSFULLY${colors.reset}`);

  } catch (error) {
    console.error(`\n${colors.red}❌ TEST SUITE FAILED${colors.reset}`);
    process.exit(1);
  } finally {
    if (apiProcess) apiProcess.kill();
  }
}

main();
