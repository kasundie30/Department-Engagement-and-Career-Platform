import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: '*', credentials: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.PORT ?? 3007;
  await app.listen(port);
  console.log(`[messaging-service] Running on http://localhost:${port}/api/v1`);
  console.log(`[messaging-service] WebSocket gateway at ws://localhost:${port}/messaging`);
}
bootstrap();
