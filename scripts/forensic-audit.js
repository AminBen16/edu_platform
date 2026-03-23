import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const STATE_FILE = path.join(ROOT, ".audit-state.json");
const BATCH_SIZE = 20;

// Recursively get all files
function getAllFiles(dir, files = []) {
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);

    if (
      entry === "node_modules" ||
      entry === ".git" ||
      entry === ".next" ||
      entry === "dist" ||
      entry === "build" ||
      entry === "android" ||
      entry === "ios" ||
      entry.endsWith(".png") ||
      entry.endsWith(".jpg") ||
      entry.endsWith(".jpeg") ||
      entry.endsWith(".svg") ||
      entry.endsWith(".lock") ||
      entry.endsWith(".log") ||
      entry.endsWith(".ico")
    ) continue;

    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

// Load or initialize state
function loadState(allFiles) {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
  }

  return {
    total: allFiles.length,
    remaining: allFiles,
    processed: []
  };
}

// Save state
function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Read file safely
function readFileChunk(file) {
  try {
    return fs.readFileSync(file, "utf-8").slice(0, 3000); // smaller chunks
  } catch (e) {
    return `ERROR READING FILE: ${file}`;
  }
}

// Send to Gemini CLI (you must have it installed)
function sendToGemini(prompt) {
  try {
    return execSync(`gemini`, {
      input: prompt,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 10
    }).toString();
  } catch (e) {
    return e.stdout?.toString() || e.message;
  }
}

// MAIN async loop
async function processLoop() {
  const allFiles = getAllFiles(ROOT);
  console.log(`Found ${allFiles.length} relevant files to audit.`);
  let state = loadState(allFiles);

  while (state.remaining.length > 0) {
    const batch = state.remaining.slice(0, BATCH_SIZE);

    console.log(`\n🔄 Processing ${batch.length} files (processed: ${state.processed.length}/${state.total}, remaining: ${state.remaining.length})`);

    // Parallel processing for speed
    const results = batch.map(file => {
      const content = readFileChunk(file);
      const prompt = `
You are a FORENSIC STATIC ANALYSIS ENGINE for a single file.

STRICT RULES:
- NO assumptions
- ONLY analyze THIS file code
- Show evidence

FILE: ${file}
${content}

TASK:
1. Issue
2. Evidence (line numbers)
3. Why critical
4. Failure scenario
5. Fix strategy (NO code changes)

If clean: "NO ISSUES FOUND"
`;

      try {
        return `## ${file}\n\`\`\`\n${content.slice(0, 500)}...\n\`\`\`\n\n${sendToGemini(prompt)}`;
      } catch (e) {
        return `## ${file}\nERROR: ${e.message}`;
      }
    });

    // Save batch results
    fs.appendFileSync("audit-report.md", results.join("\n\n---\n\n") + "\n\n");

    // Update state
    state.processed.push(...batch);
    state.remaining = state.remaining.slice(BATCH_SIZE);

    saveState(state);

    // 1s sleep between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("🎉 FULL AUDIT COMPLETE! Check audit-report.md");
}

// Run
processLoop().catch(console.error);

