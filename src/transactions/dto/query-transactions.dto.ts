export class QueryTransactionsDto {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
}
