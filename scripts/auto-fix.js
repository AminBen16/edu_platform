import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const MEMORY_FILE = path.join(ROOT, ".audit-memory.json");

const BACKUP_DIR = path.join(ROOT, ".backup");
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

// ---------------- LOAD MEMORY ----------------
function loadMemory() {
  if (!fs.existsSync(MEMORY_FILE)) {
    console.log("❌ No .audit-memory.json found");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8"));
}

// ---------------- BACKUP ----------------
function backupFile(filePath) {
  const fileName = path.basename(filePath);
  const timestamp = Date.now();
  const backupPath = path.join(BACKUP_DIR, `${fileName}.${timestamp}`);
  fs.copyFileSync(filePath, backupPath);
  console.log(`  📦 Backup: ${backupPath}`);
  return backupPath;
}

// ---------------- APPLY FIX ----------------
function applyFix(filePath, newContent) {
  fs.writeFileSync(filePath, newContent, "utf-8");
  console.log(`  ✅ Applied fix to ${path.relative(ROOT, filePath)}`);
}

// ---------------- GROQ AI FIX (adjusted from minimax) ----------------
async function generateFix(filePath, issueText, fileContent) {
  const prompt = `You are a senior software engineer fixing code issues.

STRICT RULES:
- ONLY fix the described issue
- Do NOT break existing functionality or remove working features  
- Preserve API contracts and mobile/backend compatibility
- Return ONLY the FULL corrected file code - no explanations

CONTEXT:
File: ${filePath}

CURRENT CODE (truncated if long):
\`\`\`
${fileContent.slice(0, 8000)}
\`\`\`

SPECIFIC ISSUE:
${issueText}

TASK: Return the COMPLETE corrected file content:`;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.log("❌ Set GROQ_API_KEY env var (get free at console.groq.com)");
    return null;
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          {"role": "system", "content": "You are expert code fixer. Respond with ONLY complete fixed file code."},
          {"role": "user", "content": prompt}
        ],
        temperature: 0.1,
        max_tokens: 16000
      })
    });

    if (!response.ok) throw new Error(`Groq error: ${response.status}`);

    const data = await response.json();
    const fixedCode = data.choices[0].message.content.trim();

    // Extract code block if present
    const codeMatch = fixedCode.match(/```[\s\w]*\n([\s\S]*?)\n```/);
    return codeMatch ? codeMatch[1].trim() : fixedCode;
  } catch (error) {
    console.log(`❌ Groq API error: ${error.message}`);
    return null;
  }
}

// ---------------- MAIN ----------------
async function run() {
  const memory = loadMemory();
  console.log(`🚀 Auto-Fix Engine starting... Found ${memory.issues.length} issue batches`);

  for (const entry of memory.issues) {
    console.log(`\n🔍 Processing issue: ${entry.result.slice(0, 100)}...`);
    
    for (const file of entry.files) {
      const relativeFile = path.relative(ROOT, file);
      if (!fs.existsSync(file)) {
        console.log(`  ⚠️ Skipping missing: ${relativeFile}`);
        continue;
      }

      console.log(`🔧 Fixing: ${relativeFile}`);

      const content = fs.readFileSync(file, "utf-8").slice(0, 12000); // Truncate for tokens

      const fix = await generateFix(file, entry.result, content);

      if (!fix || fix.length < 100) {
        console.log(`  ⚠️ Failed to generate meaningful fix`);
        continue;
      }

      backupFile(file);
      applyFix(file, fix);
    }
  }

  console.log("\n🎉 AUTO-FIX ENGINE COMPLETE! Check .backup/ and test your apps.");
}

run().catch(console.error);

