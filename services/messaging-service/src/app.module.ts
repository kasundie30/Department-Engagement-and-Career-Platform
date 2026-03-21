import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagingGateway } from './messaging.gateway';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/miniproject_db',
      {
        connectionFactory: (connection) => {
          connection.on('connected', () =>
            console.log('[messaging-service] MongoDB connected'),
          );
          connection.on('error', (err: Error) =>
            console.error('[messaging-service] MongoDB error:', err),
          );
          return connection;
        },
      },
    ),
    ThrottlerModule.forRoot([{ ttl: 10000, limit: 100 }]),
    AuthModule,
    ConversationsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    MessagingGateway,
  ],
})
export class AppModule {}
