export class UpdateTransactionDto {
  title?: string;
  amount?: number;
  type?: 'income' | 'expense';
  category?: string;
  date?: string;
  notes?: string | null;
}
