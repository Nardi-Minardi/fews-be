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
  CreateResponsePengangkatanPpnsDto,
  CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto,
} from './dto/create.pengangkatan.dto';
import {
  dateOnlyToLocal,
  getUserFromToken,
} from 'src/common/utils/helper.util';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { FileUploadRepository } from 'src/file-upload/file-upload.repository';
import { S3Service } from 'src/common/s3.service';
import { status_upload_ii, Prisma } from '.prisma/main-client';
import { PpnsUploadDto } from 'src/file-upload/dto/upload.dto';
import { SuratRepository } from 'src/surat/surat.repository';
import {
  PengangkatanRepository,
  PpnsPengangkatanCreateInputWithExtra,
  PpnsPengangkatanUpdateInputWithExtra,
} from './pengangkatan.repository';
import { PengangkatanValidation } from './pengangkatan.validation';
import { LayananRepository } from 'src/layanan/layanan.repository';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class PengangkatanService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private validationService: ValidationService,
    private fileUploadService: FileUploadService,
    private fileUploadRepository: FileUploadRepository,
    private pengangkatanRepository: PengangkatanRepository,
    private suratRepository: SuratRepository,
    private layananRepository: LayananRepository,
    private s3Service: S3Service,
    private prismaService: PrismaService,
  ) {}

  async storePengangkatanPpns(
    request: any & {
      dok_tanda_terima_polisi: Express.Multer.File;
      dok_tanda_terima_kejaksaan_agung: Express.Multer.File;
    },
    authorization?: string,
  ): Promise<any> {
    // clone request tanpa field file
    const safeRequest = { ...request };
    delete safeRequest.dok_tanda_terima_polisi;
    delete safeRequest.dok_tanda_terima_kejaksaan_agung;

    // log hanya field non-file
    this.logger.debug('Request create new pengangkatan PPNS', {
      request: safeRequest,
    });

    const createRequest = this.validationService.validate(
      PengangkatanValidation.CREATE_PENGANGKATAN_PPNS,
      request,
    );

    //get user login
    const userLogin = await getUserFromToken(authorization);
    if (!userLogin) {
      this.logger.error('Authorization token is missing');
      throw new BadRequestException('Authorization is missing');
    }

    //cek data pppns
    const existingPpnsDataPns = await this.prismaService.ppnsDataPns.findFirst(
      {
        where: { id_surat: Number(createRequest.id_surat) },
      },
    );

    if (!existingPpnsDataPns) {
      throw new NotFoundException(
        `Data calon ppns dengan ID ${createRequest.id_data_ppns} tidak ditemukan`,
      );
    }

    //finde surat by id_surat
    const existingSurat = await this.suratRepository.findPpnSuratById(
      Number(createRequest.id_surat),
    );

    if (!existingSurat) {
      throw new HttpException(
        `Data Ppns surat dengan ID ${createRequest.id_surat} tidak ditemukan`,
        400,
      );
    }

    const createData = {
      id_data_ppns: existingPpnsDataPns.id,
      id_surat: createRequest.id_surat ? Number(createRequest.id_surat) : null,
      nama_sekolah: createRequest.nama_sekolah,
      no_ijazah: createRequest.no_ijazah,
      tgl_ijazah: createRequest.tgl_ijazah
        ? dateOnlyToLocal(createRequest.tgl_ijazah)
        : null,
      // tgl_lulus: createRequest.tgl_lulus
      //   ? dateOnlyToLocal(createRequest.tgl_lulus)
      //   : null,
      tahun_lulus: createRequest.tahun_lulus,
      // gelar_terakhir: createRequest.gelar_terakhir,
      no_sttpl: createRequest.no_sttpl,
      tgl_sttpl: createRequest.tgl_sttpl
        ? dateOnlyToLocal(createRequest.tgl_sttpl)
        : null,
      tgl_verifikasi: createRequest.tgl_verifikasi
        ? dateOnlyToLocal(createRequest.tgl_verifikasi)
        : null,
      teknis_operasional_penegak_hukum:
        createRequest.teknis_operasional_penegak_hukum,
      jabatan: createRequest.jabatan,
      cek_surat_polisi: createRequest.cek_surat_polisi,
      no_surat_polisi: createRequest.cek_surat_polisi
        ? createRequest.no_surat_polisi
        : createRequest.no_tanda_terima_polisi,
      tgl_surat_polisi: createRequest.cek_surat_polisi
        ? createRequest.tgl_surat_polisi
          ? dateOnlyToLocal(createRequest.tgl_surat_polisi)
          : dateOnlyToLocal(createRequest.tgl_tanda_terima_polisi)
        : null,
      perihal_surat_polisi: createRequest.cek_surat_polisi
        ? createRequest.perihal_surat_polisi
        : createRequest.perihal_tanda_terima_polisi,
      cek_surat_kejaksaan_agung: createRequest.cek_surat_kejaksaan_agung,
      no_surat_kejaksaan_agung: createRequest.cek_surat_kejaksaan_agung
        ? createRequest.no_surat_kejaksaan_agung
        : createRequest.no_tanda_terima_kejaksaan_agung,
      tgl_surat_kejaksaan_agung: createRequest.cek_surat_kejaksaan_agung
        ? createRequest.tgl_surat_kejaksaan_agung
          ? dateOnlyToLocal(createRequest.tgl_surat_kejaksaan_agung)
          : dateOnlyToLocal(createRequest.tgl_tanda_terima_kejaksaan_agung)
        : null,
      perihal_surat_kejaksaan_agung: createRequest.cek_surat_kejaksaan_agung
        ? createRequest.perihal_surat_kejaksaan_agung
        : createRequest.perihal_tanda_terima_kejaksaan_agung,
    };

    //cek data pengangkatan
    const existingPpnsData = await this.prismaService.ppnsDataPns.findFirst({
      where: { id_surat: Number(createRequest.id_surat) },
    });

    console.log('existingPpnsData', existingPpnsData);

    if (!existingPpnsData) {
      throw new NotFoundException(
        `Data calon ppns dengan ID surat ${createRequest.id_surat} tidak ditemukan`,
      );
    }

    const existingPpnsPengangkatan =
      await this.pengangkatanRepository.findPpnsPengangkatanByIdSurat(
        Number(createRequest.id_surat),
      );

    console.log('existingPpnsPengangkatan', existingPpnsPengangkatan);

    let result;

    if (existingPpnsPengangkatan) {
      //update
      result = await this.pengangkatanRepository.updatePpnsPengangkatan(
        existingPpnsPengangkatan.id,
        createData as unknown as PpnsPengangkatanUpdateInputWithExtra,
      );
    }
    else {
      // create data calon ppns
      result = await this.pengangkatanRepository.savePpnsPengangkatan(
        createData as unknown as PpnsPengangkatanCreateInputWithExtra,
      );
    }

    const dataUploadDB: PpnsUploadDto[] = [];

    const layanan =
      await this.layananRepository.findLayananByNama('pengangkatan');

    // jika ada dokumen tanda terima polisi
    if (request.dok_tanda_terima_polisi) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'dokumen_tanda_terima_polisi',
        );
      const existingPolisi = await this.fileUploadRepository.findFilePpnsUpload(
        'dokumen_tanda_terima_polisi',
        Number(createRequest.id_surat),
        Number(createRequest.id_data_ppns),
      );

      await Promise.all(
        existingPolisi.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );

      const upload = await this.fileUploadService.handleUpload(
        request.dok_tanda_terima_polisi,
        'dokumen_tanda_terima_polisi',
        createRequest.id_surat ?? 0,
        createData.id_data_ppns,
        'pengangkatan',
        masterFile ? masterFile.id : null,
        'dokumen_tanda_terima_polisi',
        status_upload_ii.pending,
      );

      dataUploadDB.push(upload);
    }

    // jika ada dokumen tanda terima kejaksaan agung
    if (request.dok_tanda_terima_kejaksaan_agung) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'dokumen_tanda_terima_kejaksaan_agung',
        );
      const existingKejaksaan =
        await this.fileUploadRepository.findFilePpnsUpload(
          'dokumen_tanda_terima_kejaksaan_agung',
          Number(createRequest.id_surat),
          Number(createRequest.id_data_ppns),
        );
      await Promise.all(
        existingKejaksaan.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_tanda_terima_kejaksaan_agung,
        'dokumen_tanda_terima_kejaksaan_agung',
        createRequest.id_surat ?? 0,
        createData.id_data_ppns,
        'pengangkatan',
        masterFile ? masterFile.id : null,
        'dokumen_tanda_terima_kejaksaan_agung',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    // simpan file upload ke DB
    if (dataUploadDB.length > 0) {
      await this.suratRepository.createOrUpdatePpnsUpload(
        createRequest.id_surat ?? 0,
        dataUploadDB.map((d) => ({
          ...d,
          id_surat: createRequest.id_surat ?? 0,
          id_ppns: existingPpnsDataPns.id,
          id_file_type: d.master_file_id ?? null,
        })),
      );
    }

    //update column nama_sekolah , gelar_terakhir, no_ijazah, tgl_ijazah, tahun_lulus di ppns_data_pns
    await Prisma.validator<Prisma.PpnsDataPnsUpdateInput>()({
      nama_sekolah: createRequest.nama_sekolah,
      gelar_terakhir: createRequest.gelar_terakhir,
      no_ijazah: createRequest.no_ijazah,
      tgl_ijazah: createRequest.tgl_ijazah
        ? dateOnlyToLocal(createRequest.tgl_ijazah)
        : null,
      tahun_lulus: createRequest.tahun_lulus,
    });
    await this.suratRepository.updatePpnsDataPns(existingPpnsData.id, {
      nama_sekolah: createRequest.nama_sekolah,
      gelar_terakhir: createRequest.gelar_terakhir,
      no_ijazah: createRequest.no_ijazah,
      tgl_ijazah: createRequest.tgl_ijazah
        ? dateOnlyToLocal(createRequest.tgl_ijazah)
        : null,
      tahun_lulus: createRequest.tahun_lulus,
    });

    // ✅ ambil ulang file upload dari DB supaya data pasti sudah tersimpan
    const dok_tanda_terima_polisi =
      await this.fileUploadRepository.findFilePpnsUpload(
        'dokumen_tanda_terima_polisi',
        Number(createRequest.id_surat),
        existingPpnsDataPns.id,
      );
    const dok_tanda_terima_kejaksaan_agung =
      await this.fileUploadRepository.findFilePpnsUpload(
        'dokumen_tanda_terima_kejaksaan_agung',
        Number(createRequest.id_surat),
        existingPpnsDataPns.id,
      );

    // gabungkan uploads ke response
    return {
      ...result,
      dok_tanda_terima_polisi: dok_tanda_terima_polisi[0] || null,
      dok_tanda_terima_kejaksaan_agung:
        dok_tanda_terima_kejaksaan_agung[0] || null,
    } as CreateResponsePengangkatanPpnsDto;
  }

  async storeUploadDokumen(
    request: any & {
      dok_surat_permohonan_pengangkatan?: Express.Multer.File;
      dok_fotokopi_tamat_pendidikan?: Express.Multer.File;
      dok_surat_pertimbangan?: Express.Multer.File;
      foto?: Express.Multer.File;
    },
    authorization?: string,
  ): Promise<CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto> {
    const createRequest = this.validationService.validate(
      PengangkatanValidation.CREATE_PENGANGKATAN_UPLOAD,
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

    if (request.dok_surat_permohonan_pengangkatan) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'pengangkatan_surat_permohonan',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'pengangkatan_surat_permohonan',
        existingSurat.id,
        existingPpnsDataPns.id,
      );

      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );

      const upload = await this.fileUploadService.handleUpload(
        request.dok_surat_permohonan_pengangkatan,
        'pengangkatan_surat_permohonan',
        existingSurat.id,
        existingPpnsDataPns.id,
        'pengangkatan',
        masterFile ? masterFile.id : null,
        'pengangkatan_surat_permohonan',
        status_upload_ii.pending,
      );

      dataUploadDB.push(upload);
    }

    if (request.dok_fotokopi_tamat_pendidikan) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'pengangkatan_surat_tamat_pendidikan_ppns',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'pengangkatan_surat_tamat_pendidikan_ppns',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_fotokopi_tamat_pendidikan,
        'pengangkatan_surat_tamat_pendidikan_ppns',
        existingSurat.id,
        existingPpnsDataPns.id,
        'pengangkatan',
        masterFile ? masterFile.id : null,
        'pengangkatan_surat_tamat_pendidikan_ppns',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    if (request.dok_surat_pertimbangan) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'pengangkatan_surat_pertimbangan_kepolisian',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'pengangkatan_surat_pertimbangan_kepolisian',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_surat_pertimbangan,
        'pengangkatan_surat_pertimbangan_kepolisian',
        existingSurat.id,
        existingPpnsDataPns.id,
        'pengangkatan',
        masterFile ? masterFile.id : null,
        'pengangkatan_surat_pertimbangan_kepolisian',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    if (request.foto) {
      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
          'pengangatan_foto',
        );
      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'pengangatan_foto',
        existingSurat.id,
        existingPpnsDataPns.id,
      );
      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.foto,
        'pengangatan_foto',
        existingSurat.id,
        existingPpnsDataPns.id,
        'pengangkatan',
        masterFile ? masterFile.id : null,
        'pengangatan_foto',
        status_upload_ii.pending,
      );
      dataUploadDB.push(upload);
    }

    // simpan file upload ke DB
    if (dataUploadDB.length > 0) {
      await this.pengangkatanRepository.createOrUpdatePpnsUpload(
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
