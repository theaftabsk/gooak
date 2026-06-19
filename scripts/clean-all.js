const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

// Clean and colorful terminal console helper
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m[INFO]\x1b[0m',     // Cyan
    success: '\x1b[32m[SUCCESS]\x1b[0m', // Green
    warning: '\x1b[33m[WARNING]\x1b[0m', // Yellow
    error: '\x1b[31m[ERROR]\x1b[0m'     // Red
  };
  console.log(`${colors[type]} ${message}`);
}

const DIRS_TO_DELETE = [
  // Caches & Build files
  '.turbo',
  'backend/dist',
  'backend/.turbo',
  'backend/src/generated',
  'merchant-dashboard/.next',
  'merchant-dashboard/.turbo',
  'storefront-live/.next',
  'storefront-live/.turbo',
  'super-admin/.next',
  'super-admin/.turbo',
  
  // Dependency folders
  'node_modules',
  'backend/node_modules',
  'merchant-dashboard/node_modules',
  'storefront-live/node_modules',
  'super-admin/node_modules',
  'shared-types/node_modules',
  'shared-ui/node_modules'
];

function clean() {
  log('Starting deep clean of the OakSol Commerce workspace...', 'info');

  for (const relativePath of DIRS_TO_DELETE) {
    const fullPath = path.join(ROOT_DIR, relativePath);
    if (fs.existsSync(fullPath)) {
      try {
        log(`Removing: ${relativePath}...`, 'warning');
        fs.rmSync(fullPath, { recursive: true, force: true });
      } catch (err) {
        log(`Failed to remove ${relativePath}: ${err.message}`, 'error');
      }
    }
  }

  log('Deep cleanup completed successfully!', 'success');
}

clean();
