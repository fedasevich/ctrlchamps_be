import { Module } from '@nestjs/common';
// eslint-disable-next-line import/no-extraneous-dependencies
import { TypeOrmModule } from '@nestjs/typeorm';
// eslint-disable-next-line import/no-extraneous-dependencies
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import User from './common/entities/user.entity';
import 'dotenv/config';


@Module({
  // eslint-disable-next-line no-sparse-arrays
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: 'test',
      entities: [ User ],
      synchronize: true,
    }), AuthModule ],
  controllers: [ AppController ],
  providers: [ AppService ],
})
// eslint-disable-next-line import/prefer-default-export
export class AppModule { }
