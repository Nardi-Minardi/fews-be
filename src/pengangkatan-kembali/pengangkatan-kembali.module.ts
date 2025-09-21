import { Module } from '@nestjs/common';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { FileUploadRepository } from 'src/file-upload/file-upload.repository';
import { S3Service } from 'src/common/s3.service';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
import { LayananRepository } from 'src/layanan/layanan.repository';
import { SuratRepository } from 'src/surat/surat.repository';
import { PengangkatanKembaliController } from './pengangkatan-kembali.controller';
import { PengangkatanKembaliService } from './pengangkatan-kembali.service';
import { PengangkatanKembaliRepository } from './pengangkatan-kembali.repository';

@Module({
  controllers: [PengangkatanKembaliController],
  providers: [
    PengangkatanKembaliService,
    PengangkatanKembaliRepository,
    FileUploadService,
    FileUploadRepository,
    DataMasterRepository,
    LayananRepository,
    S3Service,
    SuratRepository,
  ],
})
export class PengangkatanKembaliModule {}
