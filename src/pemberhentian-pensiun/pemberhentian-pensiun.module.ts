import { Module } from '@nestjs/common';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { FileUploadRepository } from 'src/file-upload/file-upload.repository';
import { S3Service } from 'src/common/s3.service';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
import { LayananRepository } from 'src/layanan/layanan.repository';
import { SuratRepository } from 'src/surat/surat.repository';
import { PemberhentianPensiunController } from './pemberhentian-pensiun.controller';
import { PemberhentianPensiunService } from './pemberhentian-pensiun.service';
import { PemberhentianPensiunRepository } from './pemberhentian-pensiun.repository';
;

@Module({
  controllers: [PemberhentianPensiunController],
  providers: [
    PemberhentianPensiunService,
    PemberhentianPensiunRepository,
    FileUploadService,
    FileUploadRepository,
    DataMasterRepository,
    LayananRepository,
    S3Service,
    SuratRepository,
  ],
})
export class PemberhentianPensiunModule {}
