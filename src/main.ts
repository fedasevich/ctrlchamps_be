import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';
import 'reflect-metadata';

async function bootstrap(): Promise<void> {
  try {
    const app = await NestFactory.create(AppModule);

    const config = new DocumentBuilder()
      .setTitle('Afyanex Care')
      .setDescription('The Afyanex Care API description')
      .setVersion('1.0')
      .addTag('API Afyanex Care')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.listen(3000);
  } catch (error) {
    throw Error(error);
  }
}

bootstrap();
