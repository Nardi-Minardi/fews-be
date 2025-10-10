import { Module } from '@nestjs/common';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { FileUploadRepository } from 'src/file-upload/file-upload.repository';
import { S3Service } from 'src/common/s3.service';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
import { LayananRepository } from 'src/layanan/layanan.repository';
import { SuratRepository } from 'src/surat/surat.repository';
import { PemberhentianUndurDiriController } from './pemberhentian-undur-diri.controller';
import { PemberhentianUndurDiriService } from './pemberhentian-undur-diri.service';
import { PemberhentianUndurDiriRepository } from './pemberhentian-undur-diri.repository';
;

@Module({
  controllers: [PemberhentianUndurDiriController],
  providers: [
    PemberhentianUndurDiriService,
    PemberhentianUndurDiriRepository,
    FileUploadService,
    FileUploadRepository,
    DataMasterRepository,
    LayananRepository,
    S3Service,
    SuratRepository,
  ],
})
export class PemberhentianUndurDiriModule {}
