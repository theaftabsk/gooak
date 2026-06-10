import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS so your frontends on 3000, 3001, and 3002 can talk to the API
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
  });

  // Default to 4000 for local development
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();