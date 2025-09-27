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
import { PemberhentianPensiunValidation } from './pemberhentian-pensiun.validation';
import { PemberhentianPensiunRepository, PpnsPensiunUpdateInputWithExtra } from './pemberhentian-pensiun.repository';
import { CreateResponseUploadDokumenPpnsDto } from './dto/create.pemberhentian-pensiun.dto';

@Injectable()
export class PemberhentianPensiunService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private validationService: ValidationService,
    private fileUploadService: FileUploadService,
    private fileUploadRepository: FileUploadRepository,
    private pemberhentianPensiunRepository: PemberhentianPensiunRepository,
    private suratRepository: SuratRepository,
    private s3Service: S3Service,
  ) {}

  async storePensiun(request: any, authorization?: string): Promise<any> {
    this.logger.debug('Request create new Undur Diri PPNS', { request });
    // Handle if body is empty
    if (!request || Object.keys(request).length === 0) {
      this.logger.error('Request body is empty');
      throw new BadRequestException('Request body cannot be empty');
    }

    const createRequest = this.validationService.validate(
      PemberhentianPensiunValidation.CREATE_PENSIUN_PPNS,
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
      tgl_sk_pengangkatan_pns: createRequest.sk_pengangkatan_pns.tgl_sk_pengangkatan_pns
        ? dateOnlyToLocal(createRequest.sk_pengangkatan_pns.tgl_sk_pengangkatan_pns)
        : null,
      no_sk_pengangkatan_pns: createRequest.sk_pengangkatan_pns.no_sk_pengangkatan_pns,
      tgl_sk_kenaikan_pangkat: createRequest.sk_kenaikan_pangkat.tgl_sk_kenaikan_pangkat
        ? dateOnlyToLocal(createRequest.sk_kenaikan_pangkat.tgl_sk_kenaikan_pangkat)
        : null,
      no_sk_kenaikan_pangkat:
        createRequest.sk_kenaikan_pangkat.no_sk_kenaikan_pangkat,
      tgl_berlaku_ktp: createRequest.ktp_ppns.tgl_berlaku_ktp
        ? dateOnlyToLocal(createRequest.ktp_ppns.tgl_berlaku_ktp)
        : null,
      no_ktp: createRequest.ktp_ppns.no_ktp,
      tgl_sk_bkn: createRequest.sk_bkn.tgl_sk_bkn
        ? dateOnlyToLocal(createRequest.sk_bkn.tgl_sk_bkn)
        : null,
      no_sk_bkn: createRequest.sk_bkn.no_sk_bkn,
    };

    //cek data
    const existing =
      await this.pemberhentianPensiunRepository.findPpnsPensiunByIdDataPpns(
        Number(createRequest.id_data_ppns),
      );

    const result = await this.pemberhentianPensiunRepository.savePpnsPensiun(
      existing?.id ?? null,
      createData as PpnsPensiunUpdateInputWithExtra,
    );

    // gabungkan uploads ke response
    return result;
  }

  async storeUploadDokumen(
    request: any & {
      dok_pensiun_keputusan_pengangkatan?: Express.Multer.File;
      dok_pensiun_keputusan_kenaikan?: Express.Multer.File;
      dok_pensiun_ktp_ppns?: Express.Multer.File;
      dok_pensiun_sk_bkn?: Express.Multer.File;
    },
    authorization?: string,
  ): Promise<CreateResponseUploadDokumenPpnsDto> {
    // this.logger.debug('Request Creating Mutasi create upload dokumen', {
    //   request,
    // });
    const createRequest = this.validationService.validate(
      PemberhentianPensiunValidation.CREATE_PENSIUN_UPLOAD,
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

    if (request.dok_pensiun_keputusan_pengangkatan) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'pensiun_keputusan_pengangkatan',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'pensiun_keputusan_pengangkatan',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_pensiun_keputusan_pengangkatan,
        'pensiun_keputusan_pengangkatan',
        existingSurat.id,
        existingPpnsDataPns.id,
        'pemberhentian pensiun',
        masterFile ? masterFile.id : null,
        'pensiun_keputusan_pengangkatan',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    if (request.dok_pensiun_keputusan_kenaikan) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'pensiun_keputusan_kenaikan',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'pensiun_keputusan_kenaikan',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_pensiun_keputusan_kenaikan,
        'pensiun_keputusan_kenaikan',
        existingSurat.id,
        existingPpnsDataPns.id,
        'pemberhentian pensiun',
        masterFile ? masterFile.id : null,
        'pensiun_keputusan_kenaikan',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    if (request.dok_pensiun_ktp_ppns) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'pensiun_ktp_ppns',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'pensiun_ktp_ppns',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_pensiun_ktp_ppns,
        'pensiun_ktp_ppns',
        existingSurat.id,
        existingPpnsDataPns.id,
        'pemberhentian pensiun',
        masterFile ? masterFile.id : null,
        'pensiun_ktp_ppns',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    if (request.dok_pensiun_sk_bkn) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'pensiun_sk_bkn',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'pensiun_sk_bkn',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_pensiun_sk_bkn,
        'pensiun_sk_bkn',
        existingSurat.id,
        existingPpnsDataPns.id,
        'pemberhentian pensiun',
        masterFile ? masterFile.id : null,
        'pensiun_sk_bkn',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    // simpan file upload ke DB
    if (dataUploadDB.length > 0) {
      await this.pemberhentianPensiunRepository.createOrUpdatePpnsUpload(
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
