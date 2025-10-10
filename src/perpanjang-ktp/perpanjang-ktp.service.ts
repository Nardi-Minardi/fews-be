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
import { CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto } from './dto/create.perpanjang-ktp.dto';
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
  PerpanjangKtpRepository,
  PpnsPerpanjangKtpUpdateInputWithExtra,
} from './perpanjang-ktp.repository';
import { PerpanjangKtpValidation } from './perpanjang-ktp.validation';

@Injectable()
export class PerpanjangKtpService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private validationService: ValidationService,
    private fileUploadService: FileUploadService,
    private fileUploadRepository: FileUploadRepository,
    private perpanjangRepository: PerpanjangKtpRepository,
    private suratRepository: SuratRepository,
    private s3Service: S3Service,
  ) {}

  async storePerpanjangKtp(request: any, authorization?: string): Promise<any> {
    this.logger.debug('Request create new Perpanjang KTP PPNS', { request });
    // Handle if body is empty
    if (!request || Object.keys(request).length === 0) {
      this.logger.error('Request body is empty');
      throw new BadRequestException('Request body cannot be empty');
    }

    const createRequest = this.validationService.validate(
      PerpanjangKtpValidation.CREATE_PERPANJANG_KTP_PPNS,
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
      tgl_berlaku_ktp: createRequest.kartu_tanda_penyidik.tgl_berlaku_ktp
        ? dateOnlyToLocal(createRequest.kartu_tanda_penyidik.tgl_berlaku_ktp)
        : null,
      tgl_ktp: createRequest.kartu_tanda_penyidik.tgl_ktp
        ? dateOnlyToLocal(createRequest.kartu_tanda_penyidik.tgl_ktp)
        : null,
      no_ktp:
        createRequest.kartu_tanda_penyidik.no_ktp,
      tgl_surat_petikan: createRequest.surat_petikan.tgl_surat_petikan
        ? dateOnlyToLocal(
            createRequest.surat_petikan.tgl_surat_petikan,
          )
        : null,
      no_surat_petikan:
        createRequest.surat_petikan.no_surat_petikan,
    };

    //cek data
    const existingPerpanjangKtp =
      await this.perpanjangRepository.findPpnsPerpanjangKtpByIdDataPpns(
        Number(createRequest.id_data_ppns),
      );

    const result = await this.perpanjangRepository.savePpnsPerpanjangKtp(
      existingPerpanjangKtp?.id ?? null,
      createData as PpnsPerpanjangKtpUpdateInputWithExtra,
    );

    // gabungkan uploads ke response
    return result;
  }

  async storeUploadDokumen(
    request: any & {
      dok_perpanjangan_ktp_sk_petikan?: Express.Multer.File;
      dok_perpanjangan_ktp_fotocopy_ktp?: Express.Multer.File;
      dok_perpanjangan_ktp_berita_acara?: Express.Multer.File;
      perpanjangan_ktp_pas_foto?: Express.Multer.File;
    },
    authorization?: string,
  ): Promise<CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto> {
    // this.logger.debug('Request Creating Mutasi create upload dokumen', {
    //   request,
    // });
    const createRequest = this.validationService.validate(
      PerpanjangKtpValidation.CREATE_PERPANJANG_KTP_UPLOAD,
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

    if (request.dok_perpanjangan_ktp_sk_petikan) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'perpanjangan_ktp_sk_petikan',
        );

      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'perpanjangan_ktp_sk_petikan',
        existingSurat.id,
        existingPpnsDataPns.id,
      );

      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );

      const upload = await this.fileUploadService.handleUpload(
        request.dok_perpanjangan_ktp_sk_petikan,
        'perpanjangan_ktp_sk_petikan',
        existingSurat.id,
        existingPpnsDataPns.id,
        'perpanjang ktp',
        masterFile ? masterFile.id : null,
        'perpanjangan_ktp_sk_petikan',
        status_upload_ii.pending,
      );

      dataUploadDB.push(upload);
    }

    if (request.dok_perpanjangan_ktp_fotocopy_ktp) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'perpanjangan_ktp_fotocopy_ktp',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'perpanjangan_ktp_fotocopy_ktp',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_perpanjangan_ktp_fotocopy_ktp,
        'perpanjangan_ktp_fotocopy_ktp',
        existingSurat.id,
        existingPpnsDataPns.id,
        'perpanjang ktp',
        masterFile ? masterFile.id : null,
        'perpanjangan_ktp_fotocopy_ktp',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    if (request.dok_perpanjangan_ktp_berita_acara) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'perpanjangan_ktp_berita_acara',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'perpanjangan_ktp_berita_acara',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_perpanjangan_ktp_berita_acara,
        'perpanjangan_ktp_berita_acara',
        existingSurat.id,
        existingPpnsDataPns.id,
        'perpanjang ktp',
        masterFile ? masterFile.id : null,
        'perpanjangan_ktp_berita_acara',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    if (request.perpanjangan_ktp_pas_foto) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'perpanjangan_ktp_pas_foto',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'perpanjangan_ktp_pas_foto',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.perpanjangan_ktp_pas_foto,
        'perpanjangan_ktp_pas_foto',
        existingSurat.id,
        existingPpnsDataPns.id,
        'perpanjang ktp',
        masterFile ? masterFile.id : null,
        'perpanjangan_ktp_pas_foto',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    // simpan file upload ke DB
    if (dataUploadDB.length > 0) {
      await this.perpanjangRepository.createOrUpdatePpnsUpload(
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
