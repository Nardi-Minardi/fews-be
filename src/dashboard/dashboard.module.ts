import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from './dashboard.repository';
import { DashboardTableController } from './dashboard-table.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [DashboardController, DashboardTableController],
  providers: [DashboardService, DashboardRepository],
  exports: [],
})
export class DashboardModule {}
