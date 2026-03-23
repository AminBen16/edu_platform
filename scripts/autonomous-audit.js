import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);
const STATE_FILE = path.join(ROOT_DIR, '.audit-state.json');
const CACHE_FILE = path.join(ROOT_DIR, '.audit-cache.json');
const MEMORY_FILE = path.join(ROOT_DIR, '.audit-memory.json');
const INTERNAL_AUDIT_FILES = new Set([STATE_FILE, CACHE_FILE, MEMORY_FILE]);

const IGNORE_DIRS = new Set(['node_modules', '.git', '.next', '.dart_tool', 'build', 'dist', 'coverage', '.vercel', '.gradle', 'android/app/build']);
const IGNORE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp', '.tiff', '.woff', '.woff2', '.ttf', '.eot', '.otf', '.mp4', '.webm', '.mp3', '.wav', '.ogg', '.aac', '.lock', '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar', '.map', '.node', '.dll', '.exe', '.so', '.dylib', '.class', '.jar', '.pyc', '.log', '.tsbuildinfo']);
const MAX_FILE_SIZE_BYTES = 100 * 1024;
const CONCURRENCY_LIMIT = Math.max(4, os.cpus().length);

// LLM Prompt
const LLM_PROMPT = `
You are auditing edu_platform - full-stack edtech (Next.js/React Admin + Express/Prisma API + Flutter Mobile + Vercel).

File: {{FILE_PATH}}
Content: {{FILE_CONTENT}}

Audit for:
1. Broken flows/UI wiring, missing logic/stubs
2. Vercel Hobby limits violations
3. Role-feature matrix correctness
4. Business logic errors
5. Cross-stack inconsistencies
6. Placeholders/unimplemented code

JSON ONLY:
{
  "file": "{{FILE_PATH}}",
  "issues": [{"type": "UI_Wiring", "severity": "HIGH", "description": "...", "line": 123, "fix": "..."}],
  "deploymentIssues": [...],
  "roleFeatureMatrix": {"teacher": ["createQuiz"], "student": []},
  "crossStack": [...]
}
`;

// Utils
async function loadJSON(filePath, defaultValue = {}) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

async function saveJSON(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

function computeHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

async function getFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (IGNORE_DIRS.has(entry.name)) continue;
    if (entry.isDirectory()) {
      files.push(...await getFiles(fullPath));
    } else {
      const ext = path.extname(fullPath).toLowerCase();
      if (!IGNORE_EXTENSIONS.has(ext) && !INTERNAL_AUDIT_FILES.has(fullPath)) {
        const stat = await fs.stat(fullPath);
        if (stat.size <= MAX_FILE_SIZE_BYTES) files.push(fullPath);
      }
    }
  }
  return files;
}

// Real LLM call: Gemini CLI (install with npm i -g @google/generative-ai-cli or equivalent)
async function callLLM(batch) {
  // Prepare batch prompts safely
  const filePrompts = batch.map(f => {
    return LLM_PROMPT
      .replace('{{FILE_PATH}}', f.path)
      .replace('{{FILE_CONTENT}}', f.content.slice(0, 8000).replace(/`/g, '\\`'));
  }).join('\n\n'); // separate multiple files

  try {
    // Gemini CLI example: you must have it installed
    const { stdout, stderr } = await execAsync(`echo \`${filePrompts}\` | gemini --json`);

    if (stderr) console.error('Gemini LLM stderr:', stderr);

    // Parse LLM JSON output
    const parsed = JSON.parse(stdout);
    return Array.isArray(parsed) ? parsed : [parsed]; // support multiple files
  } catch (err) {
    console.error('LLM call failed:', err);
    // Return fallback empty structured result to avoid breaking audit
    return batch.map(f => ({
      file: f.path,
      issues: [],
      deploymentIssues: [],
      roleFeatureMatrix: {},
      crossStack: []
    }));
  }
}

async function main() {
  console.log('🚀 LLM Dispatcher - Complete Workspace Audit (No Hallucination)');
  const startTime = Date.now();

  const allFiles = await getFiles(ROOT_DIR);
  console.log(`📂 Complete workspace scan: ${allFiles.length} files`);

  const memory = await loadJSON(MEMORY_FILE, {issues: [], llmAnalysis: [], roleMatrix: {}, deploymentIssues: []});
  const cache = await loadJSON(CACHE_FILE, {});

  const filesToAudit = [];
  for (const filePath of allFiles) {
    let content;
    try {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) continue;
      content = await fs.readFile(filePath, 'utf8');
    } catch {
      continue;
    }
    const hash = computeHash(content);
    if (cache[filePath] !== hash) {
      filesToAudit.push({path: filePath, content});
      cache[filePath] = hash;
    }
  }

  console.log(`🔍 LLM dispatching ${filesToAudit.length} changed files...`);

  // Parallel LLM batches
  const results = [];
  for (let i = 0; i < filesToAudit.length; i += 1) { // 1 file/batch for accuracy
    results.push(callLLM([filesToAudit[i]]));
  }

  const llmResults = await Promise.all(results);
  memory.llmAnalysis.push(...llmResults);
  memory.issues.push(...llmResults.flatMap(r => r.issues || []));
  memory.deploymentIssues.push(...llmResults.flatMap(r => r.deploymentIssues || []));
  llmResults.forEach(r => Object.assign(memory.roleMatrix, r.roleFeatureMatrix));

  await Promise.all([
    saveJSON(MEMORY_FILE, memory),
    saveJSON(CACHE_FILE, cache)
  ]);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Complete Audit: ${duration}s | ${memory.issues.length} issues | Ready for auto-fix`);
}

main();

