import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ example: 'Tom' })
  name?: string;

  @ApiPropertyOptional({ example: true })
  notificationsEnabled?: boolean;

  @ApiPropertyOptional({ example: false })
  biometricsEnabled?: boolean;

  @ApiPropertyOptional({ example: true })
  localSyncEnabled?: boolean;
}
