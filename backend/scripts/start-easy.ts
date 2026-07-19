import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';

const BACKEND_ROOT = path.join(__dirname, '..');
const WORKSPACE_ROOT = path.join(BACKEND_ROOT, '..');
const ENV_PATH = path.join(BACKEND_ROOT, '.env');

// Clean and colorful terminal console helper
function log(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
) {
  const colors = {
    info: '\x1b[36m[INFO]\x1b[0m', // Cyan
    success: '\x1b[32m[SUCCESS]\x1b[0m', // Green
    warning: '\x1b[33m[WARNING]\x1b[0m', // Yellow
    error: '\x1b[31m[ERROR]\x1b[0m', // Red
  };
  console.log(`${colors[type]} ${message}`);
}

// 1. Environment configuration (.env) Setup
function ensureEnvFile() {
  if (!fs.existsSync(ENV_PATH)) {
    log('.env file not found. Creating a default configuration...', 'warning');
    const defaultEnv = [
      '# Database configuration (Local PostgreSQL Docker Container)',
      'DATABASE_URL="postgresql://postgres:local_password_123@localhost:5433/oak_commerce?schema=public"',
      '',
      '# Application configurations',
      'PORT=5005',
      '',
      '# JWT Authentication secret',
      'JWT_SECRET="oaksol-commerce-jwt-secret-key-replace-in-production"',
      '',
      '# SaaS platform root domain',
      'PLATFORM_DOMAIN="gooak.shop"',
      '',
    ].join('\n');
    fs.writeFileSync(ENV_PATH, defaultEnv, 'utf-8');
    log('.env file created successfully with defaults.', 'success');
  } else {
    log('.env file verified.', 'success');
  }
}

// 2. Start PostgreSQL docker container
function startDockerDatabase() {
  log('Starting PostgreSQL container via Docker Compose...', 'info');
  try {
    // Run docker-compose inside the workspace root (where docker-compose.yml lives)
    execSync('docker compose up -d', { cwd: WORKSPACE_ROOT, stdio: 'inherit' });
    log('Docker Compose command completed.', 'success');
  } catch {
    log(
      'Failed to start Docker Compose. Make sure Docker Desktop is open and running.',
      'error',
    );
    process.exit(1);
  }
}

// 3. Helper to test socket connection to PostgreSQL port
function checkDbPort(port: number, host: string): Promise<boolean> {
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

// 4. Poll database port until it is online
async function waitForDatabase(
  port: number = 5433,
  host: string = 'localhost',
  maxAttempts: number = 25,
) {
  log(
    `Waiting for PostgreSQL database on ${host}:${port} to accept connections...`,
    'info',
  );
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isOnline = await checkDbPort(port, host);
    if (isOnline) {
      log(
        'PostgreSQL database is online and accepting connections!',
        'success',
      );
      return;
    }
    log(
      `Database port not active yet (attempt ${attempt}/${maxAttempts})...`,
      'info',
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  log(
    'Database connection timed out. Please check if Docker is running properly.',
    'error',
  );
  process.exit(1);
}

// 5. Build and seed database schemas
function setupAndSeedDatabase() {
  log('Running Prisma schema setup & generating clients...', 'info');
  try {
    execSync('pnpm run db:setup', { cwd: BACKEND_ROOT, stdio: 'inherit' });
    log('Database schema setup and client generation complete.', 'success');
  } catch {
    log(
      'Database setup command failed. Check your DB credentials or Prisma schemas.',
      'error',
    );
    process.exit(1);
  }

  log('Running default database seeds...', 'info');
  try {
    execSync('pnpm run db:seed', { cwd: BACKEND_ROOT, stdio: 'inherit' });
    log('Database seeding complete.', 'success');
  } catch {
    log('Seeding failed. See output above for details.', 'warning');
  }
}

// 6. Launch watch server
function startDevelopmentServer() {
  log('Launching NestJS development server in watch mode...', 'info');

  // Use spawn to allow active stream inheritance and clean process handling
  const serverProcess = spawn('pnpm', ['run', 'start:dev'], {
    cwd: BACKEND_ROOT,
    stdio: 'inherit',
    shell: true,
  });

  serverProcess.on('close', (code) => {
    log(`Development server process terminated with code: ${code}`, 'info');
    process.exit(code ?? 0);
  });
}

// Main runner execution
async function main() {
  console.log('\n🚀 Starting Oak Commerce Backend Bootstrap...\n');
  ensureEnvFile();

  const dbUrl = process.env.DATABASE_URL || '';
  const portMatch = dbUrl.match(/:(\d+)\//);
  const dbPort = portMatch ? parseInt(portMatch[1], 10) : 5432;
  const hostMatch = dbUrl.match(/@([^:/]+)/);
  const dbHost = hostMatch ? hostMatch[1] : 'localhost';

  // Check if database is already running (e.g. local PostgreSQL via pgAdmin)
  const isOnline = await checkDbPort(dbPort, dbHost);
  if (isOnline) {
    log(`Database port ${dbPort} is already active. Skipping Docker Compose.`, 'success');
  } else {
    // Only try starting docker if it is the default docker port 5433
    if (dbPort === 5433) {
      startDockerDatabase();
      await waitForDatabase(dbPort, dbHost);
    } else {
      log(`Database port ${dbPort} is offline. Please make sure your database is running.`, 'error');
      process.exit(1);
    }
  }

  setupAndSeedDatabase();
  console.log(
    '\n🎉 Bootstrap process finished! Starting NestJS application server.\n',
  );
  startDevelopmentServer();
}

main().catch((error) => {
  log(`Execution failed unexpectedly: ${error}`, 'error');
  process.exit(1);
});
