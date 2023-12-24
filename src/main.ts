import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';

import 'reflect-metadata';

async function bootstrap(): Promise<void> {
  try {
    const app = await NestFactory.create(AppModule);
    const configService = new ConfigService();

    app.enableCors({
      origin: configService.get('CORS_ORIGIN'),
    });

    app.useGlobalPipes(new ValidationPipe());

    const config = new DocumentBuilder()
      .setTitle('CtrlChamps')
      .setDescription('The CtrlChamps API description')
      .setVersion('1.0')
      .addTag('API CtrlChamps')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.listen(process.env.APP_PORT);
  } catch (error) {
    throw Error(error);
  }
}

bootstrap();
