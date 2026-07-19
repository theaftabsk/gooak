const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

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

// 1. Detect Package Manager
let pnpmCmd = 'pnpm';
try {
  execSync('pnpm --version', { stdio: 'ignore' });
  log('pnpm is installed globally. Using native pnpm.', 'success');
} catch (e) {
  log('pnpm is not installed globally. Falling back to npx pnpm.', 'warning');
  pnpmCmd = 'npx pnpm';
}

// Helper to run commands
function runCommand(command, cwd = ROOT_DIR) {
  let fullCmd = command;
  if (command.startsWith('pnpm ')) {
    fullCmd = command.replace('pnpm ', `${pnpmCmd} `);
  }
  log(`Executing: ${fullCmd}...`, 'info');
  execSync(fullCmd, { cwd, stdio: 'inherit' });
}

// 2. Ensure Env Files
function ensureEnv(envPath, defaultContent) {
  const resolvedPath = path.join(ROOT_DIR, envPath);
  if (!fs.existsSync(resolvedPath)) {
    log(`Creating env file at ${envPath}...`, 'warning');
    fs.writeFileSync(resolvedPath, defaultContent.trim() + '\n', 'utf-8');
    log(`${envPath} created successfully with defaults.`, 'success');
  } else {
    log(`${envPath} already exists.`, 'info');
  }
}

// 3. Check Docker
function verifyDocker() {
  log('Checking Docker installation...', 'info');
  try {
    execSync('docker --version', { stdio: 'ignore' });
  } catch (e) {
    log('Docker is not installed or not in PATH. Please install Docker first.', 'error');
    process.exit(1);
  }

  log('Checking if Docker daemon is running...', 'info');
  try {
    execSync('docker info', { stdio: 'ignore' });
  } catch (e) {
    log('Docker daemon is not running! Please open/start Docker Desktop and try again.', 'error');
    process.exit(1);
  }
}

// 4. Check Port Readiness
function checkDbPort(port, host) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function waitForDatabase(port = 5433, host = 'localhost', maxAttempts = 30) {
  log(`Waiting for PostgreSQL database on ${host}:${port} to accept connections...`, 'info');
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isOnline = await checkDbPort(port, host);
    if (isOnline) {
      log('PostgreSQL database is online and accepting connections!', 'success');
      return;
    }
    log(`Database port not active yet (attempt ${attempt}/${maxAttempts})...`, 'info');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  log('Database connection timed out. Please check if Docker is running properly.', 'error');
  process.exit(1);
}

// Main sequence
async function main() {
  console.log('\n🚀 Starting Oak Commerce Project Setup & Dev Runner...\n');

  // Verify Docker is running
  verifyDocker();

  // Create default environment files if missing
  ensureEnv('backend/.env', `
# Database configuration (Local PostgreSQL Docker Container)
DATABASE_URL="postgresql://postgres:local_password_123@localhost:5433/oak_commerce?schema=public"

# Application configurations
PORT=5005

# JWT Authentication secret
JWT_SECRET="oaksol-commerce-jwt-secret-key-replace-in-production"

# SaaS platform root domain
PLATFORM_DOMAIN="gooak.shop"
  `);

  ensureEnv('merchant-dashboard/.env', `
NEXT_PUBLIC_PLATFORM_DOMAIN=gooak.shop
NEXT_PUBLIC_API_URL=http://localhost:5005/api/v1
  `);

  ensureEnv('storefront-live/.env', `
NEXT_PUBLIC_PLATFORM_DOMAIN=gooak.shop
NEXT_PUBLIC_API_URL=http://localhost:5005/api/v1
  `);

  ensureEnv('super-admin/.env', `
NEXT_PUBLIC_PLATFORM_DOMAIN=gooak.shop
NEXT_PUBLIC_API_URL=http://localhost:5005/api/v1
  `);

  // Start PostgreSQL container
  try {
    runCommand('docker compose up -d');
  } catch (error) {
    log('Failed to start docker containers.', 'error');
    process.exit(1);
  }

  // Install workspace dependencies
  log('Installing monorepo dependencies...', 'info');
  try {
    runCommand('pnpm install');
  } catch (error) {
    log('Dependency installation failed.', 'error');
    process.exit(1);
  }

  // Wait for the PostgreSQL port to be ready
  await waitForDatabase();

  // Setup Database (run migrations & seeds)
  log('Bootstrapping database (schema setup and seeding)...', 'info');
  try {
    runCommand('pnpm run db:bootstrap');
  } catch (error) {
    log('Database bootstrap failed.', 'error');
    process.exit(1);
  }

  console.log('\n=============================================================');
  log('🎉 Setup and database bootstrap completed successfully!', 'success');
  log('Starting all development servers now...', 'info');
  console.log('=============================================================\n');

  // Spawn Turborepo development servers
  const runArgs = ['run', 'dev:all'];
  let runCmd = 'pnpm';
  if (pnpmCmd.startsWith('npx')) {
    runCmd = 'npx';
    runArgs.unshift('pnpm');
  }

  log(`Launching: ${runCmd} ${runArgs.join(' ')}`, 'info');
  const devProcess = spawn(runCmd, runArgs, {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: true
  });

  devProcess.on('close', (code) => {
    log(`Development servers stopped with code: ${code}`, 'info');
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  log(`Start script failed: ${error.message || error}`, 'error');
  process.exit(1);
});
