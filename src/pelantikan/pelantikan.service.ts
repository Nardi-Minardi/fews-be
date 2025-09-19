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
import { CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto } from './dto/create.pelantikan.dto';
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
import {
  PelantikanRepository,
  PpnsPelantikanUpdateInputWithExtra,
} from './pelantikan.repository';
import { LayananRepository } from 'src/layanan/layanan.repository';
import { PelantikanValidation } from './pelantikan.validation';

@Injectable()
export class PelantikanService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private validationService: ValidationService,
    private fileUploadService: FileUploadService,
    private fileUploadRepository: FileUploadRepository,
    private pelantikanRepository: PelantikanRepository,
    private suratRepository: SuratRepository,
    private layananRepository: LayananRepository,
    private s3Service: S3Service,
  ) {}

  async storePelantikan(request: any, authorization?: string): Promise<any> {
    this.logger.debug('Request create new pelantikan PPNS', { request });
    // Handle if body is empty
    if (!request || Object.keys(request).length === 0) {
      this.logger.error('Request body is empty');
      throw new BadRequestException('Request body cannot be empty');
    }

    const createRequest = this.validationService.validate(
      PelantikanValidation.CREATE_PELANTIKAN_PPNS,
      request,
    );

    //get user login
    const userLogin = await getUserFromToken(authorization);
    if (!userLogin) {
      this.logger.error('Authorization token is missing');
      throw new BadRequestException('Authorization is missing');
    }

    //cek data pppns
    const existingPpnsDataPns = await this.suratRepository.findPpnsDataPnsById(
      Number(createRequest.id_data_ppns),
    );

    if (!existingPpnsDataPns) {
      throw new NotFoundException(
        `Data calon ppns dengan ID ${createRequest.id_data_ppns} tidak ditemukan`,
      );
    }

    const createData = {
      id_data_ppns: Number(createRequest.id_data_ppns),
      id_surat: existingPpnsDataPns.id_surat,
      no_surat: createRequest.surat_permohonan.no_surat || null,
      tgl_surat: createRequest.surat_permohonan.tgl_surat
        ? dateOnlyToLocal(createRequest.surat_permohonan.tgl_surat)
        : null,
      no_sk_induk: createRequest.surat_ket_pengangkatan.no_sk_induk,
      tgl_sk_induk: createRequest.surat_ket_pengangkatan.tgl_sk_induk
        ? dateOnlyToLocal(createRequest.surat_ket_pengangkatan.tgl_sk_induk)
        : null,
    };

    //cek data pelantikan
    const existingPpnsPelantikan =
      await this.pelantikanRepository.findPpnsPelantikanByIdDataPpns(
        Number(createRequest.id_data_ppns),
      );

    const result = await this.pelantikanRepository.savePpnsPelantikan(
      existingPpnsPelantikan?.id ?? null,
      createData as PpnsPelantikanUpdateInputWithExtra,
    );

    const layanan =
      await this.layananRepository.findLayananByNama('pelantikan');

    // gabungkan uploads ke response
    return result;
  }

  async storeUploadDokumen(
    request: any & {
      dok_pelantikan_surat_permohonan?: Express.Multer.File;
      dok_pelantikan_sk_menteri?: Express.Multer.File;
      dok_pelantikan_lampiran_menteri?: Express.Multer.File;
    },
    authorization?: string,
  ): Promise<CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto> {
    this.logger.debug('Request Creating pelantikani create upload dokumen', {
      request,
    });
    const createRequest = this.validationService.validate(
      PelantikanValidation.CREATE_PENGANGKATAN_UPLOAD,
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

    if (request.dok_pelantikan_surat_permohonan) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'pelantikan_surat_permohonan',
        );

      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'pelantikan_surat_permohonan',
        existingSurat.id,
        existingPpnsDataPns.id,
      );

      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );

      const upload = await this.fileUploadService.handleUpload(
        request.dok_pelantikan_surat_permohonan,
        'pelantikan_surat_permohonan',
        existingSurat.id,
        existingPpnsDataPns.id,
        'pelantikan',
        masterFile ? masterFile.id : null,
        'pelantikan_surat_permohonan',
        status_upload_ii.pending,
      );

      dataUploadDB.push(upload);
    }

    if (request.dok_pelantikan_sk_menteri) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'pelantikan_sk_menteri',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'pelantikan_sk_menteri',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_pelantikan_sk_menteri,
        'pelantikan_sk_menteri',
        existingSurat.id,
        existingPpnsDataPns.id,
        'pelantikan',
        masterFile ? masterFile.id : null,
        'pelantikan_sk_menteri',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    if (request.dok_pelantikan_lampiran_menteri) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'pelantikan_lampiran_menteri',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'pelantikan_lampiran_menteri',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_pelantikan_lampiran_menteri,
        'pelantikan_lampiran_menteri',
        existingSurat.id,
        existingPpnsDataPns.id,
        'pelantikan',
        masterFile ? masterFile.id : null,
        'pelantikan_lampiran_menteri',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    // simpan file upload ke DB
    if (dataUploadDB.length > 0) {
      await this.pelantikanRepository.createOrUpdatePpnsUpload(
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
