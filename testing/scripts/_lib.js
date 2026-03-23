const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { DatabaseSync } = require('node:sqlite');

const rootDir = path.resolve(__dirname, '..', '..');
const testingDir = path.resolve(__dirname, '..');
const resultsDir = path.join(testingDir, 'results');
const coverageDir = path.join(testingDir, 'coverage');
const configPath = path.join(testingDir, 'config', 'local-test.config.json');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function loadConfig() {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function openDatabase() {
  return new DatabaseSync(path.join(rootDir, 'packages', 'db', 'dev.db'));
}

function writeJson(filePath, payload) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

async function waitForHttp(url, timeoutMs = 120000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // keep waiting
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return false;
}

function mirrorStream(stream, filePath, prefix) {
  ensureDir(path.dirname(filePath));
  const output = fs.createWriteStream(filePath, { flags: 'a' });
  stream.on('data', (chunk) => {
    const text = chunk.toString();
    process.stdout.write(prefix ? `${prefix}${text}` : text);
    output.write(text);
  });
}

function startService({ name, command, args, cwd, stdoutFile, stderrFile, env }) {
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    shell: false,
    detached: false,
  });

  mirrorStream(child.stdout, stdoutFile, '');
  mirrorStream(child.stderr, stderrFile, '');

  child.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`${colors.red}${name} exited with code ${code}.${colors.reset}`);
    }
  });

  return child;
}

function stopService(child) {
  if (!child || child.killed) {
    return;
  }

  child.kill();
}

module.exports = {
  colors,
  coverageDir,
  ensureDir,
  loadConfig,
  openDatabase,
  resultsDir,
  rootDir,
  startService,
  stopService,
  testingDir,
  waitForHttp,
  writeJson,
};
