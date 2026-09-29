import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  // استخدام NestExpressApplication لدعم دمج ملفات الـ Static Assets
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  // تفعيل المجلد الثابت للملفات المرفوعة (يتم وضعه داخل التطبيق بعد إنشائه)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // إعداد Swagger
  const config = new DocumentBuilder()
    .setTitle('SpeakUp API')
    .setDescription('SpeakUp LMS & TMS API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 API Base URL: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger UI:   http://localhost:${port}/docs`);
}

bootstrap();