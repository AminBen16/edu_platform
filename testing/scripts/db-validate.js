const fs = require('fs');
const path = require('path');
const {
  colors,
  loadConfig,
  openDatabase,
  resultsDir,
  rootDir,
  writeJson,
} = require('./_lib');

const database = openDatabase();
const schemaPath = path.join(rootDir, 'packages', 'db', 'schema.prisma');
const outputFile = path.join(resultsDir, 'db-validation.json');

function parseModels() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  return Array.from(schema.matchAll(/^model\s+([A-Za-z0-9_]+)\s+\{/gm)).map(
    (match) => match[1]
  );
}

async function main() {
  console.log(`${colors.cyan}Validating Prisma schema and database...${colors.reset}`);

  const config = loadConfig();
  const models = parseModels();
  const sqliteTables = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    )
    .all();

  const school = database
    .prepare('SELECT id, domain FROM "School" WHERE domain = ? LIMIT 1')
    .get('eduplatform.local');
  const users = database
    .prepare('SELECT email, role FROM "User" WHERE school_id = ? ORDER BY email')
    .all(school?.id || '');

  const summary = {
    checkedAt: new Date().toISOString(),
    schemaModels: models.length,
    tables: sqliteTables.map((table) => table.name),
    sampleCounts: {
      schools: database.prepare('SELECT COUNT(*) AS count FROM "School"').get()
        .count,
      users: database.prepare('SELECT COUNT(*) AS count FROM "User"').get().count,
      classes: database.prepare('SELECT COUNT(*) AS count FROM "Class"').get()
        .count,
      lessons: database.prepare('SELECT COUNT(*) AS count FROM "Lesson"').get()
        .count,
      quizzes: database.prepare('SELECT COUNT(*) AS count FROM "Quiz"').get().count,
      messages: database.prepare('SELECT COUNT(*) AS count FROM "Message"').get()
        .count,
      liveSessions: database
        .prepare('SELECT COUNT(*) AS count FROM "LiveSession"')
        .get().count,
    },
    seededAccounts: users,
    configCheck: {
      adminEmail: config.credentials.admin.email,
      adminFound: users.some((user) => user.email === config.credentials.admin.email),
    },
  };

  writeJson(outputFile, summary);

  if (!summary.configCheck.adminFound) {
    throw new Error('Seed validation failed: admin account not found.');
  }

  if (!summary.sampleCounts.schools || !summary.sampleCounts.users) {
    throw new Error('Database validation failed: required seed data is missing.');
  }

  console.log(`${colors.green}Database validation passed.${colors.reset}`);
}

main()
  .catch((error) => {
    console.error(`${colors.red}${error.message}${colors.reset}`);
    process.exitCode = 1;
  })
  .finally(() => {
    database.close();
  });
