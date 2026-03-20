import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.enableCors();

  const port = process.env.PORT ?? 3007;
  await app.listen(port);
  console.log(`[messaging-service] Running on http://localhost:${port}/api/v1`);
}
bootstrap();
