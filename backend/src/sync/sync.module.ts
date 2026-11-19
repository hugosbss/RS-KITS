import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncHistoryService } from './sync-history.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [SyncController],
  providers: [SyncService, SyncHistoryService],
  exports: [SyncService, SyncHistoryService],
})
export class SyncModule {}
