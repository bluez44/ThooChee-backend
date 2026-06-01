import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBudgetDto } from './dto/update-budget.dto';

const DEFAULT_USER_ID = 'default-user';

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne() {
    const budget = await this.prisma.budget.findUnique({ where: { userId: DEFAULT_USER_ID } });
    if (!budget) {
      return { userId: DEFAULT_USER_ID, monthlyLimit: 5_000_000, currency: 'VND', updatedAt: new Date() };
    }
    return budget;
  }

  async update(dto: UpdateBudgetDto) {
    return this.prisma.budget.upsert({
      where: { userId: DEFAULT_USER_ID },
      create: { userId: DEFAULT_USER_ID, monthlyLimit: dto.monthlyLimit, currency: 'VND' },
      update: { monthlyLimit: dto.monthlyLimit },
    });
  }
}
