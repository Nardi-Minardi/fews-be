import { Module } from '@nestjs/common';
import {  SuratController } from './surat.controller';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { FileUploadRepository } from 'src/file-upload/file-upload.repository';
import { S3Service } from 'src/common/s3.service';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
import { LayananRepository } from 'src/layanan/layanan.repository';
import { SuratRepository } from './surat.repository';
import { SuratService } from './surat.service';

@Module({
  controllers: [SuratController],
  providers: [
    SuratRepository,
    SuratService,
    FileUploadService,
    FileUploadRepository,
    DataMasterRepository,
    LayananRepository,
    S3Service,
  ],
})
export class SuratModule {}
