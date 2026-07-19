const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

function log(message, type = 'info') {
  const colors = {
    info:    '\x1b[36m[INFO]\x1b[0m',
    success: '\x1b[32m[SUCCESS]\x1b[0m',
    warning: '\x1b[33m[WARNING]\x1b[0m',
    error:   '\x1b[31m[ERROR]\x1b[0m',
  };
  console.log(`${colors[type]} ${message}`);
}

function ensureEnv(envPath, defaultContent) {
  const resolved = path.join(ROOT_DIR, envPath);
  if (!fs.existsSync(resolved)) {
    log(`Creating ${envPath} with dev defaults...`, 'warning');
    fs.writeFileSync(resolved, defaultContent.trimStart(), 'utf-8');
    log(`${envPath} created.`, 'success');
  } else {
    log(`${envPath} already exists — skipping.`, 'info');
  }
}

function run(cmd, cwd = ROOT_DIR) {
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function main() {
  console.log('\n========================================');
  console.log('  Oak Commerce — Dev Setup');
  console.log('========================================\n');

  // ── 1. Install dependencies ──────────────────────────────────────────────
  log('Installing dependencies...', 'info');
  try {
    run('pnpm install');
    log('Dependencies installed.', 'success');
  } catch {
    log('pnpm install failed. Make sure pnpm is installed globally.', 'error');
    process.exit(1);
  }

  // ── 2. Create .env files with correct dev values ─────────────────────────
  ensureEnv('backend/.env', `
NODE_ENV=development
PORT=5001
DATABASE_URL="postgresql://postgres:local_password_123@localhost:5433/oak_commerce?schema=public"
JWT_SECRET="oaksol-commerce-jwt-secret-key-replace-in-production"
PLATFORM_DOMAIN="gooak.shop"
PLATFORM_ADMIN_EMAIL="admin@oaksol.in"
PLATFORM_ADMIN_PASSWORD="admin1234"
`);

  ensureEnv('merchant-dashboard/.env.local', `
NEXT_PUBLIC_PLATFORM_DOMAIN=gooak.shop
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
`);

  ensureEnv('storefront-live/.env.local', `
NEXT_PUBLIC_PLATFORM_DOMAIN=gooak.shop
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
`);

  ensureEnv('super-admin/.env.local', `
NEXT_PUBLIC_PLATFORM_DOMAIN=gooak.shop
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
`);

  // ── 3. Push both Prisma schemas → generate clients → seed ────────────────
  log('Pushing database schemas (central + tenant)...', 'info');
  try {
    run('pnpm run db:push');
    log('Schemas pushed.', 'success');
  } catch {
    log('db:push failed. Is PostgreSQL running? Check DATABASE_URL in backend/.env', 'error');
    process.exit(1);
  }

  log('Generating Prisma clients...', 'info');
  try {
    run('pnpm run db:generate');
    log('Prisma clients generated.', 'success');
  } catch {
    log('Prisma generate failed.', 'error');
    process.exit(1);
  }

  log('Seeding database (admin account + test shop + free plan)...', 'info');
  try {
    run('pnpm run db:seed');
    log('Database seeded.', 'success');
  } catch {
    log('Seed failed — check backend/scripts/seed.ts for errors.', 'error');
    process.exit(1);
  }

  console.log('\n========================================');
  log('Setup complete!', 'success');
  console.log('\n  Start all services:');
  console.log('    pnpm run dev:all\n');
  console.log('  Or backend only:');
  console.log('    pnpm run dev:backend\n');
  console.log('  Admin login:');
  console.log('    http://localhost:3002');
  console.log('    admin@oaksol.in / admin1234\n');
  console.log('  Test storefront:');
  console.log('    http://testshop.localhost:3001');
  console.log('========================================\n');
}

main();
