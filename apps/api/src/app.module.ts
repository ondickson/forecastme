import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AnalysesModule } from './analyses/analyses.module';
import { ConversationsModule } from './conversations/conversations.module';
import { DatasetsModule } from './datasets/datasets.module';
import { HealthModule } from './health/health.module';

import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    AnalysesModule,
    ConversationsModule,
    DatasetsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
