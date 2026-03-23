const { execSync } = require('child_process');
const path = require('path');
const { colors, loadConfig, rootDir } = require('./_lib');

const mobileDir = path.join(rootDir, 'apps', 'mobile');

function run(command) {
  execSync(command, {
    cwd: mobileDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      CI: 'true',
    },
  });
}

function main() {
  const config = loadConfig();
  const apiBaseUrl = config.apiBaseUrl;

  console.log(`${colors.cyan}Running Flutter integration tests...${colors.reset}`);
  run(`flutter test integration_test/app_test.dart --dart-define=API_BASE_URL=${apiBaseUrl}`);
  run(`flutter test integration_test/route_crawler_test.dart --dart-define=API_BASE_URL=${apiBaseUrl}`);
  console.log(`${colors.green}Flutter integration tests passed.${colors.reset}`);
}

try {
  main();
} catch (error) {
  console.error(`${colors.red}Flutter test runner failed.${colors.reset}`);
  process.exitCode = 1;
}
