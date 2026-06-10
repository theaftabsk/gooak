import { config } from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'prisma/config';

// 1. Force dotenv to look exactly in the same folder as this config file
config({ path: resolve(__dirname, '.env') });

// 2. Loud Fail: If it still can't find it, the console will explicitly tell us
if (!process.env.DATABASE_URL) {
  throw new Error("🚨 STOP: The .env file was not found or DATABASE_URL is misspelled!");
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});