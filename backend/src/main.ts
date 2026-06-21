import 'dotenv/config';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Enable CORS to allow multi-tenant dynamic origins (localhost:3000, localhost:3001, and custom domains)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Apply global exception filter to sanitize DB error stack traces
  app.useGlobalFilters(new HttpExceptionFilter());

  // Default to 5001 for local development to avoid macOS Control Center port 5000 conflicts
  const port = process.env.PORT ?? 5001;
  await app.listen(port);
  console.log(`OakSol Commerce backend running on port: ${port}`);
}
bootstrap();
