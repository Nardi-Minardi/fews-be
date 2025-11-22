import { Module } from '@nestjs/common';
import { DataMasterController } from './data-master.controller';
import { DataMasterService } from './data-master.service';
import { DataMasterRepository } from './data-master.repository';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [DataMasterController],
  providers: [DataMasterService, DataMasterRepository],
  exports: [],
})
export class DataMasterModule {}
