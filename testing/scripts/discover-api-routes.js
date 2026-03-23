const fs = require('fs');
const path = require('path');
const { coverageDir, rootDir, writeJson, colors } = require('./_lib');

const indexFile = path.join(rootDir, 'apps', 'api', 'src', 'index.ts');
const routesDir = path.join(rootDir, 'apps', 'api', 'src', 'routes');
const outputFile = path.join(coverageDir, 'api-endpoints.json');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function toPosix(value) {
  return value.replace(/\\/g, '/');
}

function parseImports(indexSource) {
  const matches = indexSource.matchAll(
    /import\s+([A-Za-z0-9_]+)\s+from\s+'\.\/routes\/([^']+)\.js';/g
  );

  return Array.from(matches).reduce((accumulator, match) => {
    accumulator[match[1]] = match[2];
    return accumulator;
  }, {});
}

function parseMountedRoutes(indexSource, importsMap) {
  const matches = indexSource.matchAll(
    /mount(Protected|Public)Route\('([^']+)',\s*([A-Za-z0-9_]+)\);/g
  );

  return Array.from(matches).map((match) => ({
    protected: match[1] === 'Protected',
    mountPath: match[2],
    routerVariable: match[3],
    routeFile: importsMap[match[3]] || null,
  }));
}

function parseRouteDefinitions(routeFilePath) {
  const source = read(routeFilePath);
  const matches = source.matchAll(
    /router\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g
  );

  return Array.from(matches).map((match) => ({
    method: match[1].toUpperCase(),
    routePath: match[2],
  }));
}

function joinPaths(basePath, routePath) {
  if (routePath === '/' || routePath === '') {
    return basePath;
  }

  return `${basePath}${routePath}`.replace(/\/+/g, '/');
}

function main() {
  console.log(`${colors.cyan}Discovering API routes...${colors.reset}`);

  const indexSource = read(indexFile);
  const importsMap = parseImports(indexSource);
  const mounts = parseMountedRoutes(indexSource, importsMap);
  const endpoints = [];

  for (const mount of mounts) {
    if (!mount.routeFile) {
      continue;
    }

    const routeFilePath = path.join(routesDir, `${mount.routeFile}.ts`);
    if (!fs.existsSync(routeFilePath)) {
      continue;
    }

    const definitions = parseRouteDefinitions(routeFilePath);
    for (const definition of definitions) {
      endpoints.push({
        method: definition.method,
        path: joinPaths(mount.mountPath, definition.routePath),
        protected: mount.protected,
        routeFile: toPosix(path.relative(rootDir, routeFilePath)),
      });
    }
  }

  endpoints.sort((left, right) => {
    if (left.path === right.path) {
      return left.method.localeCompare(right.method);
    }
    return left.path.localeCompare(right.path);
  });

  writeJson(outputFile, endpoints);
  console.log(
    `${colors.green}Discovered ${endpoints.length} API endpoints.${colors.reset}`
  );
}

main();
