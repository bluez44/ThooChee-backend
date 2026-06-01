import { Injectable } from '@nestjs/common';
import { UpdateBudgetDto } from './dto/update-budget.dto';

export interface Budget {
  userId: string;
  monthlyLimit: number;
  currency: string;
  updatedAt: string;
}

@Injectable()
export class BudgetService {
  private budget: Budget = {
    userId: 'default-user',
    monthlyLimit: 5_000_000,
    currency: 'VND',
    updatedAt: new Date().toISOString(),
  };

  findOne(): Budget {
    return this.budget;
  }

  update(dto: UpdateBudgetDto): Budget {
    this.budget = { ...this.budget, monthlyLimit: dto.monthlyLimit, updatedAt: new Date().toISOString() };
    return this.budget;
  }
}
