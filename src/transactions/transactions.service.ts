import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  notes: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable()
export class TransactionsService {
  private readonly store = new Map<string, Transaction>();

  findAll(query: QueryTransactionsDto): TransactionListResponse {
    const page = Math.max(Number(query.page) || 1, 1);
    const pageSize = Math.min(Number(query.pageSize) || 20, 100);

    let results = Array.from(this.store.values());

    if (query.search) {
      const term = query.search.toLowerCase();
      results = results.filter((t) => t.title.toLowerCase().includes(term));
    }
    if (query.type) results = results.filter((t) => t.type === query.type);
    if (query.category) results = results.filter((t) => t.category === query.category);
    if (query.startDate) results = results.filter((t) => t.date >= query.startDate!);
    if (query.endDate) results = results.filter((t) => t.date <= query.endDate!);

    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const totalCount = results.length;
    const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
    const transactions = results.slice((page - 1) * pageSize, page * pageSize);

    return { transactions, totalCount, page, pageSize, totalPages };
  }

  findOne(id: string): Transaction {
    const transaction = this.store.get(id);
    if (!transaction) throw new NotFoundException(`Transaction ${id} not found`);
    return transaction;
  }

  create(dto: CreateTransactionDto): Transaction {
    const now = new Date().toISOString();
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      ...dto,
      notes: dto.notes ?? null,
      userId: 'default-user',
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(transaction.id, transaction);
    return transaction;
  }

  update(id: string, dto: UpdateTransactionDto): Transaction {
    const existing = this.findOne(id);
    const updated: Transaction = {
      ...existing,
      ...dto,
      notes: 'notes' in dto ? (dto.notes ?? null) : existing.notes,
      updatedAt: new Date().toISOString(),
    };
    this.store.set(id, updated);
    return updated;
  }

  remove(id: string): { success: boolean } {
    this.findOne(id);
    this.store.delete(id);
    return { success: true };
  }
}
