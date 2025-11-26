import { Module } from '@nestjs/common';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
import { CmsDasController } from './das.controller';
import { CmsDasRepository } from './das.repository';
import { CmsDasService } from './das.service';
@Module({
  controllers: [CmsDasController ],
  providers: [DataMasterRepository, CmsDasRepository, CmsDasService],
  exports: [],
})
export class CmsDasModule {}
