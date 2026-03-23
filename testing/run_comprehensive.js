
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const API_DIR = path.resolve(__dirname, '../apps/api');
const API_PORT = 3002;
const MAX_RETRIES = 60; // 60 seconds

// Colors
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForPort(port) {
  log(`Waiting for port ${port} to be ready...`, colors.dim);
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      
      const res = await fetch(`http://localhost:${port}/api/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.ok) return true;
    } catch (e) {
      await sleep(1000);
      process.stdout.write('.');
    }
  }
  return false;
}

async function runStep(name, fn) {
  log(`\n--- [STEP] ${name} ---`, colors.cyan);
  try {
    await fn();
    log(`✔ ${name} passed`, colors.green);
  } catch (error) {
    log(`❌ ${name} failed`, colors.red);
    console.error(error);
    throw error;
  }
}

async function main() {
  log("🚀 Starting Comprehensive Local Test Suite", colors.green);

  let apiProcess;

  try {
    // 1. Start API Server
    await runStep('Start API Server', async () => {
      log('Starting API server in background...', colors.dim);
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      
      apiProcess = spawn(npmCmd, ['run', 'dev'], {
        cwd: API_DIR,
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, PORT: API_PORT.toString(), IS_LOCAL: 'true' }
      });
      
      const ready = await waitForPort(API_PORT);
      if (!ready) throw new Error(`API failed to start on port ${API_PORT}`);
    });

    // 2. Database Validation
    await runStep('Database Validation', async () => {
        // Run the db-validate script
        // We use 'node' to run the script
        execSync('node coverage/db-validate.js', { 
            cwd: __dirname, 
            stdio: 'inherit' 
        });
    });

    // 3. API Route Mapping
    await runStep('API Route Mapping', async () => {
        execSync('node coverage/route-mapper.js', { 
            cwd: __dirname, 
            stdio: 'inherit' 
        });
    });

    // 4. Security Fuzzing
    await runStep('Security Fuzzing', async () => {
        execSync('node security/api-fuzzer.js', { 
            cwd: __dirname, 
            stdio: 'inherit' 
        });
    });

    // 5. Load Testing
    await runStep('Load Testing', async () => {
        execSync('node perf/load-test.js', { 
            cwd: __dirname, 
            stdio: 'inherit' 
        });
    });
    
    // 6. Chaos Crawler
    await runStep('Chaos Crawler', async () => {
         // Try to find local binary
         const localPw = path.join(__dirname, 'node_modules', '.bin', 'playwright');
         const cmd = fs.existsSync(localPw) || fs.existsSync(localPw + '.cmd') 
            ? `"${localPw}" test frontend/chaos-crawler.spec.ts`
            : 'npx playwright test frontend/chaos-crawler.spec.ts';
            
         execSync(cmd, { 
             cwd: __dirname, 
             stdio: 'inherit' 
         });
    });

  } catch (error) {
    log('\n❌ Global Test Suite Failed', colors.red);
    process.exit(1);
  } finally {
    // Cleanup
    if (apiProcess) {
      log('\nStopping API Server...', colors.dim);
      // On Windows, killing the process tree is tricky with just .kill()
      if (process.platform === 'win32') {
          try {
            execSync(`taskkill /pid ${apiProcess.pid} /T /F`);
          } catch (e) {
              // Ignore if already dead
          }
      } else {
          apiProcess.kill();
      }
    }
  }
}

main();
