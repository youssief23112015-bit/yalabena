import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  // استخدام NestExpressApplication لدعم الملفات الثابتة (Static Assets)
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Global Prefix & API Versioning (ينتج عنه /api/v1/...)
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // CORS Configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  });

  // Serve Uploaded Files Static Directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Global Validation Pipe Configuration
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('SpeakUp Academy API')
    .setDescription(
      'Training Management System API - Complete documentation for all modules (CRM, LMS, Finance, HR, Chat, etc.)',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'JWT', // يتوافق مع @ApiBearerAuth('JWT') المستخدم في الـ Controllers
    )
    .addTag('Auth', 'Authentication & Authorization')
    .addTag('Users', 'User management & Profiles')
    .addTag('Students', 'Student lifecycle & Level history')
    .addTag('Leads', 'CRM & Lead management')
    .addTag('Sessions', 'Class scheduling & attendance')
    .addTag('LMS', 'Learning Management System')
    .addTag('Finance', 'Invoices, Payments & Promo codes')
    .addTag('HR', 'Employees, Leave requests & Payroll')
    .addTag('Chat', 'Live Chat & Compliance')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'SpeakUp API Docs',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/docs`);
}

bootstrap();