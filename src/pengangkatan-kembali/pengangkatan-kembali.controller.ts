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
import { CreateResponsePengangkatanKembaliPpnsDto } from './dto/create.pengangkatan-kembali.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PengangkatanKembaliService } from './pengangkatan-kembali.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Pengangkatan Kembali')
@Controller('/pengangkatan-kembali')
export class PengangkatanKembaliController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private pengangkatanKembaliService: PengangkatanKembaliService,
  ) {}

  @Post('/create')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create Pengangkatan Kembali' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id_data_ppns: {
          type: 'number',
          description: 'ID calon PPNS',
          example: 12345,
        },
        surat_sk_pemberhentian: {
          type: 'object',
          description: 'Data surat SK pemberhentian',
          properties: {
            tgl_sk_pemberhentian: {
              type: 'string',
              format: 'date',
              description: 'Tanggal SK pemberhentian (yyyy-mm-dd)',
              example: '2024-05-10',
            },
            no_sk_pemberhentian: {
              type: 'string',
              description: 'Nomor SK pemberhentian',
              example: 'SK-PBH-001/2024',
            },
          },
        },
        surat_sk_terakhir: {
          type: 'object',
          description: 'Data surat SK terakhir',
          properties: {
            tgl_sk_terakhir: {
              type: 'string',
              format: 'date',
              description: 'Tanggal SK terakhir (yyyy-mm-dd)',
              example: '2024-08-15',
            },
            no_sk_terakhir: {
              type: 'string',
              description: 'Nomor SK terakhir',
              example: 'SK-TRK-002/2024',
            },
          },
        },
        dp3: {
          type: 'object',
          description: 'Data DP3',
          properties: {
            tahun_dp3: {
              type: 'string',
              description: 'Tahun penilaian DP3',
              example: '2023',
            },
            nilai_dp3: {
              type: 'number',
              description: 'Nilai DP3',
              example: 90,
            },
          },
        },
        surat_skp: {
          type: 'object',
          description: 'Data SKP',
          properties: {
            tgl_skp: {
              type: 'string',
              format: 'date',
              description: 'Tanggal SKP (yyyy-mm-dd)',
              example: '2024-07-20',
            },
            nilai_skp: {
              type: 'number',
              description: 'Nilai SKP',
              example: 88,
            },
          },
        },
        biodata_baru: {
          type: 'object',
          description: 'Biodata baru PNS/PPNS',
          properties: {
            jabatan_baru: {
              type: 'string',
              description: 'Jabatan baru',
              example: 'Penyidik Pegawai Negeri Sipil',
            },
            pangkat_golongan_baru: {
              type: 'string',
              description: 'Pangkat/Golongan baru',
              example: 'III/b',
            },
          },
        },
      },
    },
  })
  async createPengangkatanKembali(
    @Body() request,
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<CreateResponsePengangkatanKembaliPpnsDto>> {
    const authorization = headers['authorization'] || '';

    const result =
      await this.pengangkatanKembaliService.storePengangkatanKembali(
        request,
        authorization,
      );

    return { statusCode: 201, message: 'Success', data: result };
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'dok_pengangkatan_kembali_sk_pemberhentian', maxCount: 1 },
      { name: 'dok_pengangkatan_kembali_daftar_penilaian', maxCount: 1 },
      { name: 'dok_pengangkatan_kembali_sk_penilaian', maxCount: 1 },
      { name: 'pengangkatan_kembali_pas_foto', maxCount: 1 },
    ]),
  )
  @Post('/upload-dokumen')
  @ApiOperation({ summary: 'Upload Dokumen' })
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
        dok_pengangkatan_kembali_sk_pemberhentian: {
          type: 'string',
          format: 'binary',
        },
        dok_pengangkatan_kembali_daftar_penilaian: {
          type: 'string',
          format: 'binary',
        },
        dok_pengangkatan_kembali_sk_penilaian: {
          type: 'string',
          format: 'binary',
        },
        pengangkatan_kembali_pas_foto: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @HttpCode(201)
  async createDokumen(
    @UploadedFiles()
    files: {
      dok_pengangkatan_kembali_sk_pemberhentian?: Express.Multer.File[];
      dok_pengangkatan_kembali_daftar_penilaian?: Express.Multer.File[];
      dok_pengangkatan_kembali_sk_penilaian?: Express.Multer.File[];
      pengangkatan_kembali_pas_foto?: Express.Multer.File[];
    },
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ) {
    const authorization = headers['authorization'] || '';
    const request = {
      ...body,
      dok_pengangkatan_kembali_sk_pemberhentian:
        files?.dok_pengangkatan_kembali_sk_pemberhentian?.[0] ?? null,
      dok_pengangkatan_kembali_daftar_penilaian:
        files?.dok_pengangkatan_kembali_daftar_penilaian?.[0] ?? null,
      dok_pengangkatan_kembali_sk_penilaian:
        files?.dok_pengangkatan_kembali_sk_penilaian?.[0] ?? null,
      pengangkatan_kembali_pas_foto:
        files?.pengangkatan_kembali_pas_foto?.[0] ?? null,
    };

    const result = await this.pengangkatanKembaliService.storeUploadDokumen(
      request,
      authorization,
    );
    return { statusCode: 201, message: 'Success', data: result };
  }
}
