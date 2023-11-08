import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [ AppController ],
  providers: [ AppService ],
})
// eslint-disable-next-line import/prefer-default-export
export class AppModule { }
