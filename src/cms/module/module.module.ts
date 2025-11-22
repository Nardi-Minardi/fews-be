import { Module } from '@nestjs/common';
import { CmsModuleController } from './module.controller';
import { CmsModuleService } from './module.service';
import { CmsModuleRepository } from './module.repository';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
@Module({
  controllers: [CmsModuleController],
  providers: [CmsModuleService, CmsModuleRepository, DataMasterRepository],
  exports: [],
})
export class CmsModuleModule {}
