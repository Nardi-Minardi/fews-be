import { Module } from '@nestjs/common';
import { DataMasterController } from './data-master.controller';
import { DataMasterService } from './data-master.service';
import { DataMasterRepository } from './data-master.repository';

@Module({
  imports: [],
  controllers: [DataMasterController],
  providers: [DataMasterService, DataMasterRepository],
  exports: [DataMasterService],
})
export class DataMasterModule {}
