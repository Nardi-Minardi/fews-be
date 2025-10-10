import { Module } from '@nestjs/common';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { FileUploadRepository } from 'src/file-upload/file-upload.repository';
import { S3Service } from 'src/common/s3.service';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
import { LayananRepository } from 'src/layanan/layanan.repository';
import { SuratRepository } from 'src/surat/surat.repository';
import { PenerbitanKembaliKtpController } from './penerbitan-kembali-ktp.controller';
import { PenerbitanKembaliKtpService } from './penerbitan-kembali-ktp.service';
import { PenerbitanKembaliKtpRepository } from './penerbitan-kembali-ktp.repository';
;

@Module({
  controllers: [PenerbitanKembaliKtpController],
  providers: [
    PenerbitanKembaliKtpService,
    PenerbitanKembaliKtpRepository,
    FileUploadService,
    FileUploadRepository,
    DataMasterRepository,
    LayananRepository,
    S3Service,
    SuratRepository,
  ],
})
export class PenerbitanKembaliKtpModule {}
