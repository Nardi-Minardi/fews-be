import { Module } from '@nestjs/common';
import { PermohonanVerifikasiController } from './permohonan-verifikasi.controller';
import { PermohonanVerifikasiRepository } from './permohonan-verifikasi.repository';
import { PermohonanVerifikasiService } from './permohonan-verifikasi.service';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { FileUploadRepository } from 'src/file-upload/file-upload.repository';
import { S3Service } from 'src/common/s3.service';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
import { LayananRepository } from 'src/layanan/layanan.repository';
import { SuratRepository } from 'src/surat/surat.repository';

@Module({
  controllers: [PermohonanVerifikasiController],
  providers: [
    PermohonanVerifikasiRepository, 
    PermohonanVerifikasiService,
    FileUploadService,
    FileUploadRepository,
    DataMasterRepository,
    LayananRepository,
    S3Service,
    SuratRepository,
  ],
})
export class PermohonanVerifikasiModule {}
