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
import { CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto } from './dto/create.pengangkatan-kembali.dto';
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
  PengangkatanKembaliRepository,
  PpnsPengangkatanKembaliUpdateInputWithExtra,
} from './pengangkatan-kembali.repository';
import { LayananRepository } from 'src/layanan/layanan.repository';
import { PengangkatanKembaliValidation } from './pengangkatan-kembali.validation';

@Injectable()
export class PengangkatanKembaliService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private validationService: ValidationService,
    private fileUploadService: FileUploadService,
    private fileUploadRepository: FileUploadRepository,
    private pengangkatanKembaliRepository: PengangkatanKembaliRepository,
    private suratRepository: SuratRepository,
    private layananRepository: LayananRepository,
    private s3Service: S3Service,
  ) {}

  async storePengangkatanKembali(
    request: any,
    authorization?: string,
  ): Promise<any> {
    this.logger.debug('Request create new Pengangkatan Kembali PPNS', {
      request,
    });
    // Handle if body is empty
    if (!request || Object.keys(request).length === 0) {
      this.logger.error('Request body is empty');
      throw new BadRequestException('Request body cannot be empty');
    }

    const createRequest: any = this.validationService.validate(
      PengangkatanKembaliValidation.CREATE_PENGANGKATAN_KEMBALI_PPNS,
      request,
    );

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
      no_sk_pemberhentian:
        createRequest.surat_sk_pemberhentian.no_sk_pemberhentian,
      tgl_sk_pemberhentian: createRequest.surat_sk_pemberhentian
        .tgl_sk_pemberhentian
        ? dateOnlyToLocal(
            createRequest.surat_sk_pemberhentian.tgl_sk_pemberhentian,
          )
        : null,
      no_sk_terakhir: createRequest.surat_sk_terakhir.no_sk_terakhir,
      tgl_sk_terakhir: createRequest.surat_sk_terakhir.tgl_sk_terakhir
        ? dateOnlyToLocal(createRequest.surat_sk_terakhir.tgl_sk_terakhir)
        : null,
      nilai_skp: createRequest.surat_skp.nilai_skp,
      tgl_skp: createRequest.surat_skp.tgl_skp
        ? dateOnlyToLocal(createRequest.surat_skp.tgl_skp)
        : null,
      nilai_dp3: Number(createRequest.dp3.nilai_dp3),
      tahun_dp3: createRequest.dp3.tahun_dp3,
      jabatan_baru: createRequest.biodata_baru.jabatan_baru,
      pangkat_golongan: createRequest.biodata_baru.pangkat_golongan_baru,
    };

    //cek data
    const existingPengangkatanKembali =
      await this.pengangkatanKembaliRepository.findPpnsPengangkatanKembaliByIdDataPpns(
        Number(createRequest.id_data_ppns),
      );

    const result =
      await this.pengangkatanKembaliRepository.savePpnsPengangkatanKembali(
        existingPengangkatanKembali?.id ?? null,
        createData as PpnsPengangkatanKembaliUpdateInputWithExtra,
      );

    return result;
  }

  async storeUploadDokumen(
    request: any & {
      dok_pengangkatan_kembali_sk_pemberhentian?: Express.Multer.File;
      dok_pengangkatan_kembali_daftar_penilaian?: Express.Multer.File;
      dok_pengangkatan_kembali_sk_penilaian?: Express.Multer.File;
      pengangkatan_kembali_pas_foto?: Express.Multer.File;
    },
    authorization?: string,
  ): Promise<CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto> {
    const createRequest = this.validationService.validate(
      PengangkatanKembaliValidation.UPLOAD_DOKUMEN_PENGANGKATAN_KEMBALI_PPNS,
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

    if (request.dok_pengangkatan_kembali_sk_pemberhentian) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'pengangkatan_kembali_sk_pemberhentian',
        );

      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'pengangkatan_kembali_sk_pemberhentian',
        existingSurat.id,
        existingPpnsDataPns.id,
      );

      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );

      const upload = await this.fileUploadService.handleUpload(
        request.dok_pengangkatan_kembali_sk_pemberhentian,
        'pengangkatan_kembali_sk_pemberhentian',
        existingSurat.id,
        existingPpnsDataPns.id,
        'pengangkatan kembali',
        masterFile ? masterFile.id : null,
        'pengangkatan_kembali_sk_pemberhentian',
        status_upload_ii.pending,
      );

      dataUploadDB.push(upload);
    }

    if (request.dok_pengangkatan_kembali_daftar_penilaian) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'pengangkatan_kembali_daftar_penilaian',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'pengangkatan_kembali_daftar_penilaian',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_pengangkatan_kembali_daftar_penilaian,
        'pengangkatan_kembali_daftar_penilaian',
        existingSurat.id,
        existingPpnsDataPns.id,
        'pengangkatan kembali',
        masterFile ? masterFile.id : null,
        'pengangkatan_kembali_daftar_penilaian',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    if (request.dok_pengangkatan_kembali_sk_penilaian) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'pengangkatan_kembali_sk_penilaian',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'pengangkatan_kembali_sk_penilaian',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_pengangkatan_kembali_sk_penilaian,
        'pengangkatan_kembali_sk_penilaian',
        existingSurat.id,
        existingPpnsDataPns.id,
        'pengangkatan kembali',
        masterFile ? masterFile.id : null,
        'pengangkatan_kembali_sk_penilaian',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    if (request.pengangkatan_kembali_pas_foto) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'pengangkatan_kembali_pas_foto',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'pengangkatan_kembali_pas_foto',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.pengangkatan_kembali_pas_foto,
        'pengangkatan_kembali_pas_foto',
        existingSurat.id,
        existingPpnsDataPns.id,
        'pengangkatan kembali',
        masterFile ? masterFile.id : null,
        'pengangkatan_kembali_pas_foto',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    // simpan file upload ke DB
    if (dataUploadDB.length > 0) {
      await this.pengangkatanKembaliRepository.createOrUpdatePpnsUpload(
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
