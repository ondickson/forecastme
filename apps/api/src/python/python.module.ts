import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PythonService } from './python.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.getOrThrow<string>('PREDICTION_SERVICE_URL'),
        timeout: 10_000,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),
  ],
  providers: [PythonService],
  exports: [PythonService],
})
export class PythonModule {}
