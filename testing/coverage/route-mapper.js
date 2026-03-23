
const fs = require('fs');
const path = require('path');

const API_ROUTES_DIR = path.resolve(__dirname, '../../apps/api/src/routes');
const colors = {
  yellow: "\x1b[33m",
  reset: "\x1b[0m"
};

function scanRoutes() {
  console.log(`${colors.yellow}🔍 Scanning for API Endpoints...${colors.reset}`);
  
  if (!fs.existsSync(API_ROUTES_DIR)) {
      console.log("Routes directory not found.");
      return;
  }

  const files = fs.readdirSync(API_ROUTES_DIR);
  let totalRoutes = 0;
  let endpoints = [];

  files.forEach(file => {
    if (file.endsWith('.ts') || file.endsWith('.js')) {
      const content = fs.readFileSync(path.join(API_ROUTES_DIR, file), 'utf8');
      const routeMatches = content.matchAll(/router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g);
      
      for (const match of routeMatches) {
        const method = match[1].toUpperCase();
        const routePath = match[2];
        const fullPath = `/api/${file.replace(/\.(ts|js)$/, '')}${routePath}`;
        endpoints.push(`${method} ${fullPath}`);
        totalRoutes++;
      }
    }
  });

  console.log(`Found ${totalRoutes} defined endpoints.`);
  // In a real scenario, you'd compare this list against your test coverage
  fs.writeFileSync(path.join(__dirname, 'endpoint-map.json'), JSON.stringify(endpoints, null, 2));
  console.log(`Endpoint map saved to testing/coverage/endpoint-map.json`);
}

scanRoutes();
