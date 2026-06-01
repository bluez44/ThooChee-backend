import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BudgetService } from './budget.service';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@ApiTags('budget')
@Controller('budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  @ApiOperation({ summary: 'Get the monthly budget' })
  @ApiResponse({ status: 200, description: 'Current budget settings.' })
  findOne() {
    return this.budgetService.findOne();
  }

  @Put()
  @ApiOperation({ summary: 'Update the monthly budget limit' })
  @ApiResponse({ status: 200, description: 'Updated budget settings.' })
  update(@Body() dto: UpdateBudgetDto) {
    return this.budgetService.update(dto);
  }
}
