import { ApiProperty } from '@nestjs/swagger';

export class UpdateBudgetDto {
  @ApiProperty({ example: 10000000, description: 'Monthly spending limit in the configured currency.' })
  monthlyLimit: number;
}
