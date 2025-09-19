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
  CreateResponsePermohonanVerifikasiPpnsVerifikasiPpnsDto,
  CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto,
} from './dto/create.permohonan-verifikasi.dto';
import { PermohonanVerifikasiValidation } from './permohonan-verifikasi.validation';
import {
  dateOnlyToLocal,
  generateUniqueString,
  getUserFromToken,
} from 'src/common/utils/helper.util';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { FileUploadRepository } from 'src/file-upload/file-upload.repository';
import { PermohonanVerifikasiRepository } from './permohonan-verifikasi.repository';
import { S3Service } from 'src/common/s3.service';
import { upload_status_enum, Prisma } from '.prisma/main-client';
import { PpnsUploadDto } from 'src/file-upload/dto/upload.dto';
import { SuratRepository } from 'src/surat/surat.repository';

@Injectable()
export class PermohonanVerifikasiService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private validationService: ValidationService,
    private fileUploadService: FileUploadService,
    private fileUploadRepository: FileUploadRepository,
    private permohonanVerifikasiRepository: PermohonanVerifikasiRepository,
    private suratRepository: SuratRepository,
    private s3Service: S3Service,
  ) {}

  async storeVerifikasiPpns(
    request: any,
    authorization?: string,
  ): Promise<CreateResponsePermohonanVerifikasiPpnsVerifikasiPpnsDto> {
    this.logger.debug('Request create permohonan verifikasi, Verikasi PPNS', {
      request,
    });

    // Handle if body is empty
    if (!request || Object.keys(request).length === 0) {
      this.logger.error('Request body is empty');
      throw new BadRequestException('Request body cannot be empty');
    }

    const createRequest = this.validationService.validate(
      PermohonanVerifikasiValidation.CREATE_VERIFIKASI_PPNS,
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
      createRequest.id_data_ppns,
    );

    if (!existingPpnsDataPns) {
      throw new NotFoundException(
        `Data calon ppns dengan ID ${createRequest.id_data_ppns} tidak ditemukan`,
      );
    }

    const createData = {
      id_data_ppns: createRequest.id_data_ppns,
      tgl_pengangkatan_sk_pns: createRequest.masa_kerja.tgl_pengangkatan_sk_pns
        ? dateOnlyToLocal(createRequest.masa_kerja.tgl_pengangkatan_sk_pns)
        : null,
      sk_kenaikan_pangkat: createRequest.masa_kerja.sk_kenaikan_pangkat,
      nama_sekolah: createRequest.pendidikan_terakhir.nama_sekolah,
      no_ijazah: createRequest.pendidikan_terakhir.no_ijazah,
      tgl_ijazah: createRequest.pendidikan_terakhir.tgl_ijazah
        ? dateOnlyToLocal(createRequest.pendidikan_terakhir.tgl_ijazah)
        : null,
      tgl_lulus: createRequest.pendidikan_terakhir.tgl_lulus
        ? dateOnlyToLocal(createRequest.pendidikan_terakhir.tgl_lulus)
        : null,
      // gelar_terakhir: createRequest.pendidikan_terakhir.gelar_terakhir,
      teknis_operasional_penegak_hukum:
        createRequest.teknis_operasional_penegak_hukum,
      jabatan: createRequest.jabatan,
      nama_rs: createRequest.surat_sehat_jasmani_rohani.nama_rs,
      tgl_surat_rs: createRequest.surat_sehat_jasmani_rohani.tgl_surat_rs
        ? dateOnlyToLocal(createRequest.surat_sehat_jasmani_rohani.tgl_surat_rs)
        : null,
      tahun_1: createRequest.dp3.tahun_1,
      nilai_1: createRequest.dp3.nilai_1,
      tahun_2: createRequest.dp3.tahun_2,
      nilai_2: createRequest.dp3.nilai_2,
    };
    //cek data pppns
    const existingPpnsVerifikasiPns =
      await this.permohonanVerifikasiRepository.findPpnsVerifikasiPnsById(
        createRequest.id_data_ppns,
      );
    console.log('existingPpnsVerifikasiPns', existingPpnsVerifikasiPns);

    let result;

    if (existingPpnsVerifikasiPns) {
      //update
      if (
        existingPpnsDataPns.id_surat === null ||
        existingPpnsDataPns.id_surat === undefined
      ) {
        throw new BadRequestException(
          'id_surat pada data PNS tidak boleh null',
        );
      }
      result =
        await this.permohonanVerifikasiRepository.updatePpnsVerifikasiPns(
          existingPpnsVerifikasiPns.id,
          existingPpnsDataPns.id_surat,
          {
            ...createData,
          },
        );
    }
    // else {
    //   // create data calon ppns
    //   result =
    //     await this.permohonanVerifikasiRepository.savePpnsVerifikasiPns(
    //       createData,
    //     );
    // }

    //update column nama_sekolah , gelar_terakhir, no_ijazah, tgl_ijazah, tahun_lulus di ppns_data_pns
    await Prisma.validator<Prisma.PpnsDataPnsUpdateInput>()({
      nama_sekolah: createRequest.pendidikan_terakhir.nama_sekolah,
      gelar_terakhir: createRequest.pendidikan_terakhir.gelar_terakhir,
      no_ijazah: createRequest.pendidikan_terakhir.no_ijazah,
      tgl_ijazah: createRequest.pendidikan_terakhir.tgl_ijazah
        ? dateOnlyToLocal(createRequest.pendidikan_terakhir.tgl_ijazah)
        : null,
      tahun_lulus: createRequest.pendidikan_terakhir.tahun_lulus,
    });
    await this.suratRepository.updatePpnsDataPns(existingPpnsDataPns.id, {
      nama_sekolah: createRequest.pendidikan_terakhir.nama_sekolah,
      gelar_terakhir: createRequest.pendidikan_terakhir.gelar_terakhir,
      no_ijazah: createRequest.pendidikan_terakhir.no_ijazah,
      tgl_ijazah: createRequest.pendidikan_terakhir.tgl_ijazah
        ? dateOnlyToLocal(createRequest.pendidikan_terakhir.tgl_ijazah)
        : null,
      tahun_lulus: createRequest.pendidikan_terakhir.tahun_lulus,
    });

    return result;
  }

  async storeUploadDokumen(
    request: any & {
      dok_verifikasi_sk_masa_kerja?: Express.Multer.File;
      dok_verifikasi_sk_pangkat?: Express.Multer.File;
      dok_verifikasi_ijazah?: Express.Multer.File;
      dok_verifikasi_sk_jabatan_teknis_oph?: Express.Multer.File;
      dok_verifikasi_sehat_jasmani?: Express.Multer.File;
      dok_verifikasi_penilaian_pekerjaan?: Express.Multer.File;
    },
    authorization?: string,
  ): Promise<CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto> {
    
    const createRequest = this.validationService.validate(
      PermohonanVerifikasiValidation.CREATE_VERIFIKASI_UPLOAD,
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

    if (request.dok_verifikasi_sk_masa_kerja) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'verifikasi_sk_masa_kerja',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'verifikasi_sk_masa_kerja',
        existingSurat.id,
        existingPpnsDataPns.id,
      );

      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_verifikasi_sk_masa_kerja,
        'verifikasi_sk_masa_kerja',
        existingSurat.id,
        existingPpnsDataPns.id,
        'verifikasi',
        masterFile ? masterFile.id : null,
        'verifikasi_sk_masa_kerja',
        upload_status_enum.pending,
      );

      dataUploadDB.push(upload);
    }

    if (request.dok_verifikasi_sk_pangkat) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'verifikasi_sk_pangkat',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'verifikasi_sk_pangkat',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_verifikasi_sk_pangkat,
        'verifikasi_sk_pangkat',
        existingSurat.id,
        existingPpnsDataPns.id,
        'verifikasi',
        masterFile ? masterFile.id : null,
        'verifikasi_sk_pangkat',
        upload_status_enum.pending,
      );
      dataUploadDB.push(upload);
    }

    if (request.dok_verifikasi_ijazah) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'verifikasi_ijazah',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'verifikasi_ijazah',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_verifikasi_ijazah,
        'verifikasi_ijazah',
        existingSurat.id,
        existingPpnsDataPns.id,
        'verifikasi',
        masterFile ? masterFile.id : null,
        'verifikasi_ijazah',
        upload_status_enum.pending,
      );
      dataUploadDB.push(upload);
    }

    if (request.dok_verifikasi_sk_jabatan_teknis_oph) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'verifikasi_sk_jabatan_teknis_oph',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'verifikasi_sk_jabatan_teknis_oph',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_verifikasi_sk_jabatan_teknis_oph,
        'verifikasi_sk_jabatan_teknis_oph',
        existingSurat.id,
        existingPpnsDataPns.id,
        'verifikasi',
        masterFile ? masterFile.id : null,
        'verifikasi_sk_jabatan_teknis_oph',
        upload_status_enum.pending,
      );
      dataUploadDB.push(upload);
    }

    if (request.dok_verifikasi_sehat_jasmani) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'verifikasi_sehat_jasmani',
        );

      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'verifikasi_sehat_jasmani',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_verifikasi_sehat_jasmani,
        'verifikasi_sehat_jasmani',
        existingSurat.id,
        existingPpnsDataPns.id,
        'verifikasi',
        masterFile ? masterFile.id : null,
        'verifikasi_sehat_jasmani',
        upload_status_enum.pending,
      );
      dataUploadDB.push(upload);
    }

    if (request.dok_verifikasi_penilaian_pekerjaan) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'verifikasi_penilaian_pekerjaan',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'verifikasi_penilaian_pekerjaan',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_verifikasi_penilaian_pekerjaan,
        'verifikasi_penilaian_pekerjaan',
        existingSurat.id,

        existingPpnsDataPns.id,
        'verifikasi',
        masterFile ? masterFile.id : null,
        'verifikasi_penilaian_pekerjaan',
        upload_status_enum.pending,
      );
      dataUploadDB.push(upload);
    }

    // simpan file upload ke DB
    if (dataUploadDB.length > 0) {
      await this.permohonanVerifikasiRepository.createOrUpdateVerifikasiPpnsUpload(
        existingSurat.id,
        dataUploadDB.map((d) => ({
          ...d,
          id_ppns: d.id_ppns ?? 0, // fallback to 0 if null
          id_file_type: d.master_file_id ?? null,
        })),
      );
    }

    return { message: 'Upload dokumen berhasil disimpan/diupdate' };
  }
}
