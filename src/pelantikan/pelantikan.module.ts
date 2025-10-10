import { Module } from '@nestjs/common';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { FileUploadRepository } from 'src/file-upload/file-upload.repository';
import { S3Service } from 'src/common/s3.service';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
import { LayananRepository } from 'src/layanan/layanan.repository';
import { SuratRepository } from 'src/surat/surat.repository';
import { PelantikanController } from './pelantikan.controller';
import { PelantikanService } from './pelantikan.service';
import { PelantikanRepository } from './pelantikan.repository';
;

@Module({
  controllers: [PelantikanController],
  providers: [
    PelantikanService,
    PelantikanRepository,
    FileUploadService,
    FileUploadRepository,
    DataMasterRepository,
    LayananRepository,
    S3Service,
    SuratRepository,
  ],
})
export class PelantikanModule {}
