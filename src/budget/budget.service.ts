import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBudgetDto } from './dto/update-budget.dto';

const DEFAULT_USER_ID = 'default-user';
const DEFAULTS = { userId: DEFAULT_USER_ID, monthlyLimit: 5_000_000, currency: 'VND' };

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}

  findOne() {
    // Creates the record with defaults on first access, returns existing on subsequent calls
    return this.prisma.budget.upsert({
      where: { userId: DEFAULT_USER_ID },
      create: DEFAULTS,
      update: {},
    });
  }

  update(dto: UpdateBudgetDto) {
    return this.prisma.budget.upsert({
      where: { userId: DEFAULT_USER_ID },
      create: { ...DEFAULTS, monthlyLimit: dto.monthlyLimit },
      update: { monthlyLimit: dto.monthlyLimit },
    });
  }

  async reset() {
    await this.prisma.budget.deleteMany({ where: { userId: DEFAULT_USER_ID } });
    return this.findOne();
  }
}
