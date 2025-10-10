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
import { CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto } from './dto/create.mutasi.dto';
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
  MutasiRepository,
  PpnsMutasiUpdateInputWithExtra,
} from './mutasi.repository';
import { LayananRepository } from 'src/layanan/layanan.repository';
import { MutasiValidation } from './mutasi.validation';

@Injectable()
export class MutasiService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private validationService: ValidationService,
    private fileUploadService: FileUploadService,
    private fileUploadRepository: FileUploadRepository,
    private mutasiRepository: MutasiRepository,
    private suratRepository: SuratRepository,
    private layananRepository: LayananRepository,
    private s3Service: S3Service,
  ) {}

  async storeMutasi(request: any, authorization?: string): Promise<any> {
    this.logger.debug('Request create new Mutasi PPNS', { request });
    // Handle if body is empty
    if (!request || Object.keys(request).length === 0) {
      this.logger.error('Request body is empty');
      throw new BadRequestException('Request body cannot be empty');
    }

    const createRequest = this.validationService.validate(
      MutasiValidation.CREATE_MUTASI_PPNS,
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
      no_keputusan_pangkat:
        createRequest.surat_keputusan_pangkat.no_keputusan_pangkat,
      tgl_keputusan_pangkat: createRequest.surat_keputusan_pangkat
        .tgl_keputusan_pangkat
        ? dateOnlyToLocal(
            createRequest.surat_keputusan_pangkat.tgl_keputusan_pangkat,
          )
        : null,
      no_keputusan_kenaikan_pangkat:
        createRequest.surat_keputusan_kenaikan_pangkat
          .no_keputusan_kenaikan_pangkat,
      tgl_keputusan_kenaikan_pangkat: createRequest
        .surat_keputusan_kenaikan_pangkat.tgl_keputusan_kenaikan_pangkat
        ? dateOnlyToLocal(
            createRequest.surat_keputusan_kenaikan_pangkat
              .tgl_keputusan_kenaikan_pangkat,
          )
        : null,
      no_sk_mutasi_wilayah_kerja:
        createRequest.surat_sk_mutasi_wilayah_kerja.no_sk_mutasi_wilayah_kerja,
      tgl_sk_mutasi_wilayah_kerja: createRequest.surat_sk_mutasi_wilayah_kerja
        .tgl_sk_mutasi_wilayah_kerja
        ? dateOnlyToLocal(
            createRequest.surat_sk_mutasi_wilayah_kerja
              .tgl_sk_mutasi_wilayah_kerja,
          )
        : null,
    };

    //cek data
    const existingMutasi =
      await this.mutasiRepository.findPpnsMutasiByIdDataPpns(
        Number(createRequest.id_data_ppns),
      );

    const result = await this.mutasiRepository.savePpnsMutasi(
      existingMutasi?.id ?? null,
      createData as PpnsMutasiUpdateInputWithExtra,
    );

    const layanan = await this.layananRepository.findLayananByNama('mutasi');

    // gabungkan uploads ke response
    return result;
  }

  async storeUploadDokumen(
    request: any & {
      dok_mutasi_keputusan_pengangkatan?: Express.Multer.File;
      dok_mutasi_keputusan_kenaikan_pangkat?: Express.Multer.File;
      dok_mutasi_sk_mutasi?: Express.Multer.File;
      mutasi_pas_foto?: Express.Multer.File;
    },
    authorization?: string,
  ): Promise<CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto> {
    // this.logger.debug('Request Creating Mutasi create upload dokumen', {
    //   request,
    // });
    const createRequest = this.validationService.validate(
      MutasiValidation.CREATE_MUTASI_UPLOAD,
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

    if (request.dok_mutasi_keputusan_pengangkatan) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'mutasi_keputusan_pengangkatan',
        );

      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'mutasi_keputusan_pengangkatan',
        existingSurat.id,
        existingPpnsDataPns.id,
      );

      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );

      const upload = await this.fileUploadService.handleUpload(
        request.dok_mutasi_keputusan_pengangkatan,
        'mutasi_keputusan_pengangkatan',
        existingSurat.id,
        existingPpnsDataPns.id,
        'mutasi',
        masterFile ? masterFile.id : null,
        'mutasi_keputusan_pengangkatan',
        status_upload_ii.pending,
      );

      dataUploadDB.push(upload);
    }

    if (request.dok_mutasi_keputusan_kenaikan_pangkat) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'mutasi_keputusan_kenaikan_pangkat',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'mutasi_keputusan_kenaikan_pangkat',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_mutasi_keputusan_kenaikan_pangkat,
        'mutasi_keputusan_kenaikan_pangkat',
        existingSurat.id,
        existingPpnsDataPns.id,
        'mutasi',
        masterFile ? masterFile.id : null,
        'mutasi_keputusan_kenaikan_pangkat',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    if (request.dok_mutasi_sk_mutasi) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'mutasi_sk_mutasi',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'mutasi_sk_mutasi',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_mutasi_sk_mutasi,
        'mutasi_sk_mutasi',
        existingSurat.id,
        existingPpnsDataPns.id,
        'mutasi',
        masterFile ? masterFile.id : null,
        'mutasi_sk_mutasi',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    if (request.mutasi_pas_foto) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'mutasi_pas_foto',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'mutasi_pas_foto',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.mutasi_pas_foto,
        'mutasi_pas_foto',
        existingSurat.id,
        existingPpnsDataPns.id,
        'mutasi',
        masterFile ? masterFile.id : null,
        'mutasi_pas_foto',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    // simpan file upload ke DB
    if (dataUploadDB.length > 0) {
      await this.mutasiRepository.createOrUpdatePpnsUpload(
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
