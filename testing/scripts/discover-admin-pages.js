const fs = require('fs');
const path = require('path');
const { coverageDir, rootDir, writeJson, colors } = require('./_lib');

const pagesDir = path.join(rootDir, 'apps', 'admin', 'pages');
const outputFile = path.join(coverageDir, 'admin-pages.json');

function walk(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function toRoute(filePath) {
  const relativePath = path.relative(pagesDir, filePath).replace(/\\/g, '/');

  if (
    relativePath.startsWith('api/') ||
    relativePath.startsWith('_') ||
    !/\.(tsx|ts|jsx|js)$/.test(relativePath)
  ) {
    return null;
  }

  const noExtension = relativePath.replace(/\.(tsx|ts|jsx|js)$/, '');
  if (noExtension === 'index') {
    return '/';
  }

  return `/${noExtension.replace(/\/index$/, '').replace(/\[(.+?)\]/g, ':$1')}`;
}

function main() {
  console.log(`${colors.cyan}Discovering admin pages...${colors.reset}`);

  const routes = walk(pagesDir)
    .map(toRoute)
    .filter(Boolean)
    .sort();

  writeJson(outputFile, routes);
  console.log(
    `${colors.green}Discovered ${routes.length} admin routes.${colors.reset}`
  );
}

main();
