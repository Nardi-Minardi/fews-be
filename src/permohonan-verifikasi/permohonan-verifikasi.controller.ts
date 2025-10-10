import {
  Body,
  Controller,
  Headers,
  Inject,
  Post,
  HttpCode,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { Pagination, WebResponse } from 'src/common/web.response';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  CreateResponsePermohonanVerifikasiPpnsVerifikasiPpnsDto,
  CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto,
} from './dto/create.permohonan-verifikasi.dto';
import { PermohonanVerifikasiService } from './permohonan-verifikasi.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Permohonan Verifikasi')
@Controller('/verifikasi')
export class PermohonanVerifikasiController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private permohonanVerifikasiService: PermohonanVerifikasiService,
  ) {}

  @Post('/ppns/create')
  @ApiOperation({ summary: 'Create Permohonan Verifikasi' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id_data_ppns: {
          type: 'number',
          description: 'ID calon PPNS yang mau diupdate (optional jika create)',
          example: 12345,
        },
        masa_kerja: {
          type: 'object',
          description: 'Data masa kerja PNS',
          properties: {
            tgl_pengangkatan_sk_pns: {
              type: 'string',
              format: 'date',
              description: 'Tanggal pengangkatan SK PNS (yyyy-mm-dd)',
              example: '2023-06-12',
            },
            sk_kenaikan_pangkat: {
              type: 'string',
              description: 'Nomor SK kenaikan pangkat, wajib diisi',
              example: 'SK-123/2023',
            },
          },
        },
        pendidikan_terakhir: {
          type: 'object',
          description: 'Data pendidikan terakhir',
          properties: {
            nama_sekolah: {
              type: 'string',
              description: 'Nama sekolah/universitas',
              example: 'Universitas Indonesia',
            },
            gelar_terakhir: {
              type: 'string',
              description: 'Gelar terakhir',
              example: 'S.H.',
            },
            no_ijazah: {
              type: 'string',
              description: 'Nomor ijazah',
              example: 'IJZ-2020-00999',
            },
            tgl_ijazah: {
              type: 'string',
              format: 'date',
              description: 'Tanggal ijazah',
              example: '2020-08-17',
            },
            tahun_lulus: {
              type: 'string',
              description: 'Tahun lulus',
              example: '2020',
            },
          },
        },
        teknis_operasional_penegak_hukum: {
          type: 'boolean',
          description: 'Apakah terkait teknis operasional penegak hukum',
          example: true,
        },
        jabatan: {
          type: 'string',
          description: 'Jabatan (optional)',
          example: 'Penyidik Pegawai Negeri Sipil',
        },
        surat_sehat_jasmani_rohani: {
          type: 'object',
          description: 'Data surat sehat jasmani dan rohani',
          properties: {
            nama_rs: {
              type: 'string',
              description: 'Nama rumah sakit',
              example: 'RSUD Jakarta Selatan',
            },
            tgl_surat_rs: {
              type: 'string',
              format: 'date',
              description: 'Tanggal surat RS',
              example: '2024-01-05',
            },
          },
        },
        dp3: {
          type: 'object',
          description: 'Data DP3 2 tahun terakhir',
          properties: {
            tahun_1: {
              type: 'string',
              description: 'Tahun pertama',
              example: '2022',
            },
            nilai_1: {
              type: 'number',
              description: 'Nilai DP3 tahun pertama',
              example: 90.5,
            },
            tahun_2: {
              type: 'string',
              description: 'Tahun kedua',
              example: '2023',
            },
            nilai_2: {
              type: 'number',
              description: 'Nilai DP3 tahun kedua',
              example: 88.0,
            },
          },
        },
      },
    },
  })
  @HttpCode(201)
  async createVerifikasiPpns(
    @Body() request,
    @Headers() headers: Record<string, any>,
  ): Promise<
    WebResponse<CreateResponsePermohonanVerifikasiPpnsVerifikasiPpnsDto>
  > {
    const authorization = headers['authorization'] || '';
    const result = await this.permohonanVerifikasiService.storeVerifikasiPpns(
      request,
      authorization,
    );

    return { statusCode: 201, message: 'Success', data: result };
  }

  //create surat
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'dok_verifikasi_sk_masa_kerja', maxCount: 1 },
      { name: 'dok_verifikasi_sk_pangkat', maxCount: 1 },
      { name: 'dok_verifikasi_ijazah', maxCount: 1 },
      { name: 'dok_verifikasi_sk_jabatan_teknis_oph', maxCount: 1 },
      { name: 'dok_verifikasi_sehat_jasmani', maxCount: 1 },
      { name: 'dok_verifikasi_penilaian_pekerjaan', maxCount: 1 },
    ]),
  )
  @ApiOperation({ summary: 'Upload Dokumen' })
  @Post('/upload-dokumen')
  @HttpCode(201)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id_surat: {
          type: 'number',
          example: 12345,
        },
        id_ppns: {
          type: 'number',
          example: 12345,
        },
        dok_verifikasi_sk_masa_kerja: {
          type: 'string',
          format: 'binary',
        },
        dok_verifikasi_sk_pangkat: {
          type: 'string',
          format: 'binary',
        },
        dok_verifikasi_ijazah: {
          type: 'string',
          format: 'binary',
        },
        dok_verifikasi_sk_jabatan_teknis_oph: {
          type: 'string',
          format: 'binary',
        },
        dok_verifikasi_sehat_jasmani: {
          type: 'string',
          format: 'binary',
        },
        dok_verifikasi_penilaian_pekerjaan: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async createDokumen(
    @UploadedFiles()
    files: {
      dok_verifikasi_sk_masa_kerja?: Express.Multer.File[];
      dok_verifikasi_sk_pangkat?: Express.Multer.File[];
      dok_verifikasi_ijazah?: Express.Multer.File[];
      dok_verifikasi_sk_jabatan_teknis_oph?: Express.Multer.File[];
      dok_verifikasi_sehat_jasmani?: Express.Multer.File[];
      dok_verifikasi_penilaian_pekerjaan?: Express.Multer.File[];
    },
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ): Promise<
    WebResponse<CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto>
  > {
    const authorization = headers['authorization'] || '';
    const request = {
      ...body,
      dok_verifikasi_sk_masa_kerja:
        files?.dok_verifikasi_sk_masa_kerja?.[0] ?? null,
      dok_verifikasi_sk_pangkat: files?.dok_verifikasi_sk_pangkat?.[0] ?? null,
      dok_verifikasi_ijazah: files?.dok_verifikasi_ijazah?.[0] ?? null,
      dok_verifikasi_sk_jabatan_teknis_oph:
        files?.dok_verifikasi_sk_jabatan_teknis_oph?.[0] ?? null,
      dok_verifikasi_sehat_jasmani:
        files?.dok_verifikasi_sehat_jasmani?.[0] ?? null,
      dok_verifikasi_penilaian_pekerjaan:
        files?.dok_verifikasi_penilaian_pekerjaan?.[0] ?? null,
    };

    const result = await this.permohonanVerifikasiService.storeUploadDokumen(
      request,
      authorization,
    );

    return { statusCode: 201, message: 'Success', data: result };
  }
}
