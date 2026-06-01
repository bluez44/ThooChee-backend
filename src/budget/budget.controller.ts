import { Controller, Get, Put, Delete, Body } from '@nestjs/common';
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

  @Delete()
  @ApiOperation({ summary: 'Reset budget to defaults', description: 'Deletes the current budget record and re-initialises with default values (5,000,000 VND).' })
  @ApiResponse({ status: 200, description: 'Budget reset to defaults.' })
  reset() {
    return this.budgetService.reset();
  }
}
