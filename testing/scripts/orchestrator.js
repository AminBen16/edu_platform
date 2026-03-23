const { execSync } = require('child_process');
const path = require('path');
const {
  colors,
  loadConfig,
  resultsDir,
  rootDir,
  startService,
  stopService,
  waitForHttp,
} = require('./_lib');

const testingDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'apps', 'api');
const adminDir = path.join(rootDir, 'apps', 'admin');

function run(command, cwd = testingDir, extraEnv = {}) {
  execSync(command, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
}

async function main() {
  const config = loadConfig();
  const apiCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  console.log(`${colors.cyan}Starting complete local test system...${colors.reset}`);

  run('node scripts/discover-api-routes.js');
  run('node scripts/discover-admin-pages.js');
  run('npm run db:seed');
  run('node scripts/db-validate.js');
  run('npm run prisma:generate', apiDir);
  run('npm run build', apiDir);

  const apiProcess = startService({
    name: 'API',
    command: apiCommand,
    args: ['run', 'start'],
    cwd: apiDir,
    stdoutFile: path.join(resultsDir, 'logs', 'api.stdout.log'),
    stderrFile: path.join(resultsDir, 'logs', 'api.stderr.log'),
  });

  const adminProcess = startService({
    name: 'Admin',
    command: apiCommand,
    args: ['run', 'dev'],
    cwd: adminDir,
    stdoutFile: path.join(resultsDir, 'logs', 'admin.stdout.log'),
    stderrFile: path.join(resultsDir, 'logs', 'admin.stderr.log'),
  });

  try {
    const apiReady = await waitForHttp(`${config.apiBaseUrl.replace('/api/v1', '')}/api/health`);
    if (!apiReady) {
      throw new Error('API did not become ready on http://127.0.0.1:3002/api/health');
    }

    const adminReady = await waitForHttp(`${config.adminBaseUrl}/auth/login`);
    if (!adminReady) {
      throw new Error('Admin app did not become ready on http://127.0.0.1:3000/auth/login');
    }

    run('node scripts/api-smoke.js');
    run('npx playwright test frontend/platform-crawler.spec.ts', testingDir, {
      PLAYWRIGHT_BASE_URL: config.adminBaseUrl,
    });
    run('node scripts/mobile-runner.js');

    console.log(`${colors.green}All local test suites passed.${colors.reset}`);
  } finally {
    stopService(adminProcess);
    stopService(apiProcess);
  }
}

main().catch((error) => {
  console.error(`${colors.red}${error.message}${colors.reset}`);
  process.exitCode = 1;
});
