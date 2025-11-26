import { Module } from '@nestjs/common';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
import { CmsSensorController } from './sensor.controller';
import { CmsSensorRepository } from './sensor.repository';
import { CmsSensorService } from './sensor.service';
@Module({
  controllers: [CmsSensorController],
  providers: [DataMasterRepository, CmsSensorRepository, CmsSensorService],
  exports: [],
})
export class CmsSensorModule {}
