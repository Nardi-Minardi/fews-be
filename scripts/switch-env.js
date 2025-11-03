// Cross-platform .env switcher
// Usage: node scripts/copy-env.js [dev|staging|prod]
// Or: cross-env APP_ENV=dev node scripts/copy-env.js

const fs = require('fs');
const path = require('path');

function main() {
  const arg = process.argv[2] || process.env.APP_ENV || 'dev';
  const cwd = process.cwd();
  const envMap = {
    dev: '.env.dev',
    development: '.env.dev',
    stg: '.env.staging',
    staging: '.env.staging',
    prod: '.env.prod',
    production: '.env.prod',
  };

  const srcName = envMap[arg] || envMap.dev;
  const src = path.join(cwd, srcName);
  const dest = path.join(cwd, '.env');

  if (!fs.existsSync(src)) {
    console.error(`[copy-env] Source env file not found: ${srcName}`);
    process.exit(1);
  }

  try {
    fs.copyFileSync(src, dest);
    console.log(`[copy-env] ${srcName} -> .env`);
  } catch (err) {
    console.error('[copy-env] Failed to copy env file:', err.message);
    process.exit(1);
  }
}

main();
