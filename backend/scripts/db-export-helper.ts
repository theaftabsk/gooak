import { execSync, spawn } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env configurations
dotenv.config({ path: path.join(__dirname, '../.env') });

function runLocalFallback(host: string, port: string, user: string, database: string, password: string, exportPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Docker export unavailable or failed. Falling back to local pg_dump...');
    try {
      execSync(
        `pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -F p -f "${exportPath}"`,
        {
          env: {
            ...process.env,
            PGPASSWORD: password,
          },
          stdio: 'inherit',
        },
      );
      console.log(`Database exported successfully using local pg_dump to: ${exportPath}`);
      resolve();
    } catch (error) {
      reject(new Error('Local pg_dump export failed. Ensure pg_dump is on your PATH.'));
    }
  });
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  const match = connectionString.match(
    /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?#\s]+)/,
  );

  if (!match) {
    console.error('Failed to parse DATABASE_URL from .env configuration.');
    process.exit(1);
  }

  const [, user, password, host, port, database] = match;
  const exportPath = path.join(__dirname, '../../db_export.sql');

  console.log(
    `Exporting database "${database}" from ${host}:${port} as user "${user}"...`,
  );

  // Check if docker is available and the container is running
  let isDockerRunning = false;
  try {
    const activeContainers = execSync('docker ps', { encoding: 'utf-8' });
    if (activeContainers.includes('oak_commerce_db')) {
      isDockerRunning = true;
    }
  } catch (e) {
    // Docker not running or not installed
  }

  if (isDockerRunning) {
    console.log('Attempting container-native database export via docker exec...');
    const writeStream = fs.createWriteStream(exportPath);
    
    const dumpProcess = spawn('docker', [
      'exec',
      '-i',
      'oak_commerce_db',
      'pg_dump',
      '-U',
      user,
      '-d',
      database,
    ]);

    dumpProcess.stdout.pipe(writeStream);

    dumpProcess.stderr.on('data', (data) => {
      console.warn(`[pg_dump stderr]: ${data.toString()}`);
    });

    dumpProcess.on('close', async (code) => {
      writeStream.end();
      if (code === 0) {
        console.log(`Database exported successfully via docker to: ${exportPath}`);
        process.exit(0);
      } else {
        console.error(`docker pg_dump process exited with code ${code}. trying local fallback...`);
        try {
          await runLocalFallback(host, port, user, database, password, exportPath);
          process.exit(0);
        } catch (err: any) {
          console.error(err.message);
          process.exit(1);
        }
      }
    });

    dumpProcess.on('error', async (err) => {
      console.error(`Failed to start docker process: ${err.message}. trying local fallback...`);
      writeStream.end();
      try {
        await runLocalFallback(host, port, user, database, password, exportPath);
        process.exit(0);
      } catch (fallbackErr: any) {
        console.error(fallbackErr.message);
        process.exit(1);
      }
    });
  } else {
    try {
      await runLocalFallback(host, port, user, database, password, exportPath);
      process.exit(0);
    } catch (err: any) {
      console.error(err.message);
      process.exit(1);
    }
  }
}

main();
