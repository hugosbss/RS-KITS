import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { AthletesModule } from './athletes/athletes.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { DevicesModule } from './devices/devices.module';
import { SyncModule } from './sync/sync.module';
import { LogsModule } from './logs/logs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    EventsModule,
    AthletesModule,
    DeliveriesModule,
    DevicesModule,
    SyncModule,
    LogsModule,
    NotificationsModule,
    AuditModule,
    WebsocketModule,
  ],
})
export class AppModule {}
