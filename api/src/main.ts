import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // All routes are prefixed with /api
  app.setGlobalPrefix('api');

  // 🔓 DEV-ONLY: wide open CORS so Angular (4200) can call Nest (3000)
  app.enableCors({
    origin: '*', // allow all origins in dev
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
  });

  await app.listen(3000);
}
bootstrap();
