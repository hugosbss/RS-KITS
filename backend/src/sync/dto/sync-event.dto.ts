import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SyncEventDto {
  @ApiProperty({ type: [Object] })
  @IsArray()
  events!: Array<{
    operation: string;
    entity: string;
    entityId: string;
    deviceId?: string;
    userId?: string;
    timestamp: string;
    payload?: Record<string, unknown>;
  }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;
}
