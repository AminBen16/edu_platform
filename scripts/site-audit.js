import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const STATE_FILE = path.join(ROOT_DIR, 'audit_state.json');

const DEFAULT_URLS = [
  'http://localhost:3000',  // Admin panel
  'http://localhost:3001/health',  // API health (adjust port if needed)
  'https://www.example.com'  // Fallback demo
];

/**
 * Audit a single site URL - port of Python audit_site()
 * @param {string} url
 */
async function auditSite(url) {
  console.log(`Starting technical audit for: ${url}\\n`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);  // 10s timeout
  
  try {
    const startTime = performance.now();
    const response = await fetch(url, {
      signal: controller.signal,
      method: 'GET',
      headers: { 'User-Agent': 'EduPlatform-SiteAuditor/1.0' }
    });
    const endTime = performance.now();
    
    clearTimeout(timeoutId);
    const loadTime = (endTime - startTime) / 1000;  // seconds
    
    // Check Status Code
    if (response.ok) {
      console.log(`[SUCCESS] Site is reachable.`);
      console.log(`[METRIC] Load Time: ${loadTime.toFixed(2)} seconds`);
      
      if (loadTime > 2.5) {
        console.log('[ALERT] Load time is slow. Google prefers under 2.5s.');
      }
    } else {
      console.log(`[WARNING] Site returned status code: ${response.status}`);
    }
    
    return {
      url,
      status: response.status,
      loadTime: loadTime.toFixed(2),
      ok: response.ok,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.log(`[ERROR] Could not connect to the site: ${error.message}`);
    return {
      url,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Update audit_state.json with metrics
 */
async function updateAuditState(metrics) {
  try {
    const state = await fs.readFile(STATE_FILE, 'utf8').then(JSON.parse).catch(() => ({}));
    state.siteMetrics = state.siteMetrics || [];
    state.siteMetrics.push(...metrics);
    // Keep last 10 runs
    state.siteMetrics = state.siteMetrics.slice(-10);
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`\\n[INFO] Metrics saved to ${STATE_FILE}`);
  } catch (e) {
    console.log(`[WARNING] Could not update ${STATE_FILE}: ${e.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const urls = args.length > 0 ? args : DEFAULT_URLS;
  
  console.log('🚀 EduPlatform Site Auditor (Node.js port)\\n');
  
  const results = [];
  for (const url of urls) {
    const result = await auditSite(url);
    results.push(result);
  }
  
  await updateAuditState(results);
  
  // Summary
  console.log('\\n📊 SUMMARY:');
  results.forEach(r => {
    if (r.ok !== undefined) {
      console.log(`  ${r.url}: ${r.status} (${r.loadTime}s)`);
    } else {
      console.log(`  ${r.url}: ERROR (${r.error.slice(0, 30)}...)`);
    }
  });
}

main().catch(console.error);
