import { Module } from '@nestjs/common';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
import { CmsDeviceController } from './device.controller';
import { CmsDeviceRepository } from './device.repository';
import { CmsDeviceService } from './device.service';
@Module({
  controllers: [CmsDeviceController],
  providers: [CmsDeviceRepository, CmsDeviceService, DataMasterRepository],
  exports: [],
})
export class CmsDeviceModule {}
