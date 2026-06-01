import { Controller, Get, Put, Body } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Controller('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  findOne() {
    return this.budgetService.findOne();
  }

  @Put()
  update(@Body() dto: UpdateBudgetDto) {
    return this.budgetService.update(dto);
  }
}
