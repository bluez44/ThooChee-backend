import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryTransactionsDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number (default: 1)' })
  page?: number;

  @ApiPropertyOptional({ example: 20, description: 'Items per page (default: 20, max: 100)' })
  pageSize?: number;

  @ApiPropertyOptional({ example: 'lunch', description: 'Case-insensitive title search' })
  search?: string;

  @ApiPropertyOptional({ enum: ['income', 'expense'] })
  type?: 'income' | 'expense';

  @ApiPropertyOptional({ example: 'Food' })
  category?: string;

  @ApiPropertyOptional({ example: '2026-06-01', description: 'Filter from this date (YYYY-MM-DD)' })
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-06-30', description: 'Filter up to this date (YYYY-MM-DD)' })
  endDate?: string;
}
