import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransactionsModule } from './transactions/transactions.module';
import { VoiceModule } from './voice/voice.module';
import { BudgetModule } from './budget/budget.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [TransactionsModule, VoiceModule, BudgetModule, ProfileModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
