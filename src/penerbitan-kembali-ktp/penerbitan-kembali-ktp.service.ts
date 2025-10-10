import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ValidationService } from 'src/common/validation.service';
import { Logger } from 'winston';
import {
  dateOnlyToLocal,
  generateUniqueString,
  getUserFromToken,
} from 'src/common/utils/helper.util';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { FileUploadRepository } from 'src/file-upload/file-upload.repository';
import { S3Service } from 'src/common/s3.service';
import { status_upload_ii, Prisma } from '.prisma/main-client';
import { PpnsUploadDto } from 'src/file-upload/dto/upload.dto';
import { SuratRepository } from 'src/surat/surat.repository';
import { PenerbitanKembaliKtpValidation } from './penerbitan-kembali-ktp.validation';
import { PenerbitanKembaliKtpRepository, PpnsPenerbitanKembaliKtpUpdateInputWithExtra } from './penerbitan-kembali-ktp.repository';
import { CreateResponseUploadDokumenPpnsDto } from './dto/create.penerbitan-kembali-ktp.dto';

@Injectable()
export class PenerbitanKembaliKtpService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private validationService: ValidationService,
    private fileUploadService: FileUploadService,
    private fileUploadRepository: FileUploadRepository,
    private penerbitanKembaliKtpRepository: PenerbitanKembaliKtpRepository,
    private suratRepository: SuratRepository,
    private s3Service: S3Service,
  ) {}

  async storeUploadDokumen(
    request: any & {
      dok_penerbitan_kembali_ktp_surat_kehilangan?: Express.Multer.File;
      dok_penerbitan_kembali_ktp_ktp_rusak?: Express.Multer.File;
      penerbitan_kembali_ktp_pas_foto?: Express.Multer.File;
    },
    authorization?: string,
  ): Promise<CreateResponseUploadDokumenPpnsDto> {
    // this.logger.debug('Request Creating Mutasi create upload dokumen', {
    //   request,
    // });
    const createRequest = this.validationService.validate(
      PenerbitanKembaliKtpValidation.CREATE_PENERBITAN_KEMBALI_KTP_UPLOAD,
      request,
    );

    //get user login
    const userLogin = await getUserFromToken(authorization);
    if (!userLogin) {
      this.logger.error('Authorization token is missing');
      throw new BadRequestException('Authorization is missing');
    }

    //cek find surat
    const existingSurat = await this.suratRepository.findPpnSuratById(
      Number(createRequest.id_surat),
    );

    if (!existingSurat) {
      throw new HttpException(
        `Data Ppns surat dengan ID ${createRequest.id_surat} tidak ditemukan`,
        400,
      );
    }

    //cek find ppns
    const existingPpnsDataPns = await this.suratRepository.findPpnsDataPnsById(
      Number(createRequest.id_ppns),
    );
    if (!existingPpnsDataPns) {
      throw new NotFoundException(
        `Data calon ppns dengan ID ${createRequest.id_ppns} tidak ditemukan`,
      );
    }

    const dataUploadDB: PpnsUploadDto[] = [];

    if (request.dok_penerbitan_kembali_ktp_surat_kehilangan) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'penerbitan_kembali_ktp_surat_kehilangan',
        );

      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'penerbitan_kembali_ktp_surat_kehilangan',
        existingSurat.id,
        existingPpnsDataPns.id,
      );

      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );

      const upload = await this.fileUploadService.handleUpload(
        request.dok_penerbitan_kembali_ktp_surat_kehilangan,
        'penerbitan_kembali_ktp_surat_kehilangan',
        existingSurat.id,
        existingPpnsDataPns.id,
        'penerbitan kembali ktp',
        masterFile ? masterFile.id : null,
        'penerbitan_kembali_ktp_surat_kehilangan',
        status_upload_ii.pending,
      );

      dataUploadDB.push(upload);
    }

    if (request.dok_penerbitan_kembali_ktp_ktp_rusak) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'penerbitan_kembali_ktp_ktp_rusak',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'penerbitan_kembali_ktp_ktp_rusak',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_penerbitan_kembali_ktp_ktp_rusak,
        'penerbitan_kembali_ktp_ktp_rusak',
        existingSurat.id,
        existingPpnsDataPns.id,
        'penerbitan kembali ktp',
        masterFile ? masterFile.id : null,
        'penerbitan_kembali_ktp_ktp_rusak',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    if (request.penerbitan_kembali_ktp_pas_foto) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'penerbitan_kembali_ktp_pas_foto',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'penerbitan_kembali_ktp_pas_foto',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.penerbitan_kembali_ktp_pas_foto,
        'penerbitan_kembali_ktp_pas_foto',
        existingSurat.id,
        existingPpnsDataPns.id,
        'penerbitan kembali ktp',
        masterFile ? masterFile.id : null,
        'penerbitan_kembali_ktp_pas_foto',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    // simpan file upload ke DB
    if (dataUploadDB.length > 0) {
      await this.penerbitanKembaliKtpRepository.createOrUpdatePpnsUpload(
        existingSurat.id,
        dataUploadDB.map((d) => ({
          ...d,
          id_surat: existingSurat.id,
          id_ppns: d.id_ppns ?? 0, // fallback to 0 if null
          id_file_type: d.master_file_id ?? null,
        })),
      );
    }

    return { message: 'Upload dokumen berhasil disimpan/diupdate' };
  }
}
