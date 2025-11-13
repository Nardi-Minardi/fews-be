import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from './dashboard.repository';
import { DashboardTableController } from './dashboard-table.controller';

@Module({
  imports: [],
  controllers: [DashboardController, DashboardTableController],
  providers: [DashboardService, DashboardRepository],
})
export class DashboardModule {}
