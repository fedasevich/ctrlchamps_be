import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { runQuery } from './modules/database/connection.query';
import 'reflect-metadata';
// eslint-disable-next-line import/no-extraneous-dependencies, import/order
import 'dotenv/config';


async function bootstrap(): Promise<void> {
    await runQuery();
    const app = await NestFactory.create(AppModule);
    await app.listen(3000);
}

bootstrap();
