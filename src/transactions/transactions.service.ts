import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryTransactionsDto) {
    const page = Math.max(Number(query.page) || 1, 1);
    const pageSize = Math.min(Number(query.pageSize) || 20, 100);

    const where: Prisma.TransactionWhereInput = {};
    if (query.search) where.title = { contains: query.search, mode: 'insensitive' };
    if (query.type) where.type = query.type;
    if (query.category) where.category = query.category;
    if (query.startDate || query.endDate) {
      where.date = {
        ...(query.startDate && { gte: query.startDate }),
        ...(query.endDate && { lte: query.endDate }),
      };
    }

    const [transactions, totalCount] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      totalCount,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(totalCount / pageSize), 1),
    };
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({ where: { id } });
    if (!transaction) throw new NotFoundException(`Transaction ${id} not found`);
    return transaction;
  }

  async create(dto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: { ...dto, notes: dto.notes ?? null, userId: 'default-user' },
    });
  }

  async update(id: string, dto: UpdateTransactionDto) {
    await this.findOne(id);
    return this.prisma.transaction.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<{ success: boolean }> {
    await this.findOne(id);
    await this.prisma.transaction.delete({ where: { id } });
    return { success: true };
  }
}
