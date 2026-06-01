import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTransactionDto {
  @ApiPropertyOptional({ example: 'Dinner out' })
  title?: string;

  @ApiPropertyOptional({ example: 120000 })
  amount?: number;

  @ApiPropertyOptional({ enum: ['income', 'expense'], example: 'expense' })
  type?: 'income' | 'expense';

  @ApiPropertyOptional({ example: 'Food' })
  category?: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  date?: string;

  @ApiPropertyOptional({ example: 'Updated note', nullable: true })
  notes?: string | null;
}
