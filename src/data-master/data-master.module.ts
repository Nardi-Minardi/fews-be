import { Module } from '@nestjs/common';
import { DataMasterRepository } from './data-master.repository';
import { DataMasterController } from './data-master.controller';
import { DataMasterService } from './data-master.service';
import { SuratRepository } from 'src/surat/surat.repository';
import { LayananRepository } from 'src/layanan/layanan.repository';

@Module({
  controllers: [DataMasterController],
  providers: [DataMasterRepository, DataMasterService, SuratRepository, LayananRepository],
})
export class DataMasterModule {}
