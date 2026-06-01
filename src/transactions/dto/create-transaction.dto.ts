import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransactionDto {
  @ApiProperty({ example: 'Lunch at cafe' })
  title: string;

  @ApiProperty({ example: 50000 })
  amount: number;

  @ApiProperty({ enum: ['income', 'expense'], example: 'expense' })
  type: 'income' | 'expense';

  @ApiProperty({ example: 'Food' })
  category: string;

  @ApiProperty({ example: '2026-06-01', description: 'ISO 8601 date (YYYY-MM-DD)' })
  date: string;

  @ApiPropertyOptional({ example: 'Paid by card', nullable: true })
  notes?: string | null;
}
