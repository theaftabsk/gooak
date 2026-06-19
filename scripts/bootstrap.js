const { execSync } = require('child_process');
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

function ensureEnv(envPath, defaultContent) {
  const resolvedPath = path.join(ROOT_DIR, envPath);
  if (!fs.existsSync(resolvedPath)) {
    log(`Creating environment configuration for ${envPath}...`, 'warning');
    fs.writeFileSync(resolvedPath, defaultContent.trim() + '\n', 'utf-8');
    log(`${envPath} created successfully with defaults.`, 'success');
  } else {
    log(`${envPath} already exists. Skipping.`, 'info');
  }
}

function main() {
  console.log('\n🚀 Starting Oak Commerce Project Setup & Bootstrap...\n');

  // 1. Run pnpm install
  log('Installing project dependencies...', 'info');
  try {
    execSync('pnpm install', { cwd: ROOT_DIR, stdio: 'inherit' });
    log('Dependencies installed successfully.', 'success');
  } catch (error) {
    log('Failed to install dependencies. Make sure pnpm is installed globally.', 'error');
    process.exit(1);
  }

  // 2. Setup environment files
  ensureEnv('backend/.env', `
# Database configuration (Local PostgreSQL Docker Container)
DATABASE_URL="postgresql://postgres:local_password_123@localhost:5433/oak_commerce?schema=public"

# Application configurations
PORT=5005

# JWT Authentication secret
JWT_SECRET="oaksol-commerce-jwt-secret-key-replace-in-production"

# SaaS platform root domain
PLATFORM_DOMAIN="posix.digital"
  `);

  ensureEnv('merchant-dashboard/.env', `
NEXT_PUBLIC_PLATFORM_DOMAIN=posix.digital
NEXT_PUBLIC_API_URL=http://localhost:5005/api/v1
  `);

  ensureEnv('storefront-live/.env', `
NEXT_PUBLIC_PLATFORM_DOMAIN=posix.digital
NEXT_PUBLIC_API_URL=http://localhost:5005/api/v1
  `);

  ensureEnv('super-admin/.env', `
NEXT_PUBLIC_PLATFORM_DOMAIN=posix.digital
NEXT_PUBLIC_API_URL=http://localhost:5005/api/v1
  `);

  // 3. Setup and seed database
  log('Starting PostgreSQL container & running migrations/seeds...', 'info');
  try {
    execSync('pnpm run db:bootstrap', { cwd: ROOT_DIR, stdio: 'inherit' });
    log('Database bootstrap sequence completed successfully.', 'success');
  } catch (error) {
    log('Database bootstrap failed. Make sure Docker is running and active.', 'error');
    process.exit(1);
  }

  console.log('\n=============================================================');
  log('🎉 Setup completed successfully!', 'success');
  log('Run the following command to start all services in development mode:', 'info');
  console.log('   pnpm run dev:all');
  console.log('=============================================================\n');
}

main();
