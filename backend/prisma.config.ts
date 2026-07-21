import { config } from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'prisma/config';

// 1. Force dotenv to look exactly in the same folder as this config file
config({ path: resolve(__dirname, '.env') });

const dbUrl = process.env.DATABASE_URL;

// 2. Loud Fail: If it still can't find it and we are not in a build/Render environment, throw error.
if (!dbUrl) {
  if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    console.warn("⚠️ DATABASE_URL is not set. Using placeholder for build/generation.");
  } else {
    throw new Error("🚨 STOP: The .env file was not found or DATABASE_URL is misspelled!");
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: dbUrl || "postgresql://postgres:postgres@localhost:5432/placeholder",
  },
});