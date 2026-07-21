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
  log('Checking Docker availability...', 'info');
  try {
    execSync('docker --version', { stdio: 'ignore' });
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch (e) {
    log('Docker is not running or not installed. Will use local PostgreSQL.', 'warning');
    return false;
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

async function waitForDatabase(port = 5432, host = 'localhost', maxAttempts = 15) {
  log(`Checking PostgreSQL database connection on ${host}:${port}...`, 'info');
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isOnline = await checkDbPort(port, host);
    if (isOnline) {
      log('PostgreSQL database is online and accepting connections!', 'success');
      return true;
    }
    log(`Database port ${port} not active yet (attempt ${attempt}/${maxAttempts})...`, 'info');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

// Main sequence
async function main() {
  console.log('\n🚀 Starting Oak Commerce Project Setup & Dev Runner...\n');

  const dockerAvailable = verifyDocker();

  // Create default environment files if missing
  ensureEnv('backend/.env', `
# Database configuration (Local PostgreSQL pgAdmin)
DATABASE_URL="postgresql://postgres:123456@localhost:5432/gooak?schema=public"

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

  // Parse DB URL from backend/.env
  let dbPort = 5432;
  let dbHost = 'localhost';
  try {
    const envContent = fs.readFileSync(path.join(ROOT_DIR, 'backend/.env'), 'utf-8');
    const dbUrlLine = envContent.split('\n').find(l => l.startsWith('DATABASE_URL='));
    if (dbUrlLine) {
      const portMatch = dbUrlLine.match(/:(\d+)\//);
      if (portMatch) dbPort = parseInt(portMatch[1], 10);
      const hostMatch = dbUrlLine.match(/@([^:/]+)/);
      if (hostMatch) dbHost = hostMatch[1];
    }
  } catch (e) {}

  // Check if database port is already active
  let isDbReady = await checkDbPort(dbPort, dbHost);

  if (!isDbReady && dockerAvailable && dbPort === 5433) {
    try {
      log('Starting PostgreSQL container via Docker...', 'info');
      runCommand('docker compose up -d');
      isDbReady = await waitForDatabase(dbPort, dbHost);
    } catch (error) {
      log('Failed to start docker containers.', 'warning');
    }
  } else if (isDbReady) {
    log(`Using active local PostgreSQL server on ${dbHost}:${dbPort}`, 'success');
  } else {
    log(`Local PostgreSQL on ${dbHost}:${dbPort} is offline. Please make sure PostgreSQL service is running!`, 'warning');
  }

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
