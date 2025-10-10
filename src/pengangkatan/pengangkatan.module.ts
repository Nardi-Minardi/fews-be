import { Module } from '@nestjs/common';
import { PengangkatanController } from './pengangkatan.controller';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { FileUploadRepository } from 'src/file-upload/file-upload.repository';
import { S3Service } from 'src/common/s3.service';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
import { LayananRepository } from 'src/layanan/layanan.repository';
import { SuratRepository } from 'src/surat/surat.repository';
import { PengangkatanService } from './pengangkatan.service';
import { PengangkatanRepository } from './pengangkatan.repository';

@Module({
  controllers: [PengangkatanController],
  providers: [
    PengangkatanService,
    PengangkatanRepository,
    FileUploadService,
    FileUploadRepository,
    DataMasterRepository,
    LayananRepository,
    S3Service,
    SuratRepository,
  ],
})
export class PengangkatanModule {}
