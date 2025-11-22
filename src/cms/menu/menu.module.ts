import { Module } from '@nestjs/common';
import { CmsMenuController } from './menu.controller';
import { CmsMenuService } from './menu.service';
import { CmsMenuRepository } from './menu.repository';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
import { CmsModuleRepository } from '../module/module.repository';
import { AuthRepository } from 'src/auth/auth.repository';
@Module({
  controllers: [CmsMenuController],
  providers: [
    CmsMenuService,
    CmsMenuRepository,
    CmsModuleRepository,
    DataMasterRepository,
    AuthRepository,
  ],
  exports: [],
})
export class CmsMenuModule {}
