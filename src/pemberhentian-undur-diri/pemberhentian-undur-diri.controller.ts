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
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CreateResponseUndurDiriPpnsDto } from './dto/create.pemberhentian-undur-diri.dto';
import { PemberhentianUndurDiriService } from './pemberhentian-undur-diri.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Pemberhentian Undur Diri')
@Controller('/pemberhentian-undur-diri')
export class PemberhentianUndurDiriController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private pemberhentianUndurDiriService: PemberhentianUndurDiriService,
  ) {}

  @Post('/create')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create Pemberhentian Undur Diri' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id_data_ppns: {
          type: 'number',
          description: 'ID calon PPNS yang wajib diisi',
          example: 12345,
        },
        sk_pengangkatan_pns: {
          type: 'object',
          description: 'Surat keputusan pengangkatan PNS',
          properties: {
            tgl_sk_pengangkatan_pns: {
              type: 'string',
              format: 'date',
              description: 'Tanggal SK pengangkatan PNS (yyyy-mm-dd)',
              example: '2024-05-20',
            },
            no_sk_pengangkatan_pns: {
              type: 'string',
              description: 'Nomor SK pengangkatan PNS',
              example: 'SK-123/2024',
            },
          },
        },
        sk_kenaikan_pangkat: {
          type: 'object',
          description: 'Surat keputusan kenaikan pangkat PNS',
          properties: {
            tgl_sk_kenaikan_pangkat: {
              type: 'string',
              format: 'date',
              description: 'Tanggal SK kenaikan pangkat (yyyy-mm-dd)',
              example: '2024-08-15',
            },
            no_sk_kenaikan_pangkat: {
              type: 'string',
              description: 'Nomor SK kenaikan pangkat',
              example: 'KP-456/2024',
            },
          },
        },
        ktp_ppns: {
          type: 'object',
          description: 'Data KTP PPNS',
          properties: {
            tgl_berlaku_ktp: {
              type: 'string',
              format: 'date',
              description: 'Tanggal berlaku KTP (yyyy-mm-dd)',
              example: '2030-12-31',
            },
            no_ktp: {
              type: 'string',
              description: 'Nomor KTP PPNS',
              example: '3201234567890001',
            },
          },
        },
        sk_persetujuan: {
          type: 'object',
          description: 'SK persetujuan',
          properties: {
            tgl_sk_persetujuan: {
              type: 'string',
              format: 'date',
              description: 'Tanggal SK persetujuan (yyyy-mm-dd)',
              example: '2024-09-01',
            },
            no_sk_persetujuan: {
              type: 'string',
              description: 'Nomor SK persetujuan',
              example: 'SP-789/2024',
            },
          },
        },
        sk_pemberhentian: {
          type: 'object',
          description: 'SK pemberhentian',
          properties: {
            tgl_sk_pemberhentian: {
              type: 'string',
              format: 'date',
              description: 'Tanggal SK pemberhentian (yyyy-mm-dd)',
              example: '2024-12-31',
            },
            no_sk_pemberhentian: {
              type: 'string',
              description: 'Nomor SK pemberhentian',
              example: 'PH-999/2024',
            },
          },
        },
      },
    },
  })
  async createUndurDiri(
    @Body() request,
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<CreateResponseUndurDiriPpnsDto>> {
    const authorization = headers['authorization'] || '';

    const result = await this.pemberhentianUndurDiriService.storeUndurDiri(
      request,
      authorization,
    );

    return { statusCode: 201, message: 'Success', data: result };
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'dok_undur_diri_keputusan_pengangkatan', maxCount: 1 },
      { name: 'dok_undur_diri_keputusan_kenaikan_pangkat', maxCount: 1 },
      { name: 'dok_undur_diri_ktp_ppns', maxCount: 1 },
      { name: 'dok_undur_diri_surat_persetujuan', maxCount: 1 },
      { name: 'dok_undur_diri_surat_permohonan', maxCount: 1 },
    ]),
  )
  @Post('/upload-dokumen')
  @HttpCode(201)
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
        dok_undur_diri_keputusan_pengangkatan: {
          type: 'string',
          format: 'binary',
        },
        dok_undur_diri_keputusan_kenaikan_pangkat: {
          type: 'string',
          format: 'binary',
        },
        dok_undur_diri_ktp_ppns: {
          type: 'string',
          format: 'binary',
        },
        dok_undur_diri_surat_persetujuan: {
          type: 'string',
          format: 'binary',
        },
        dok_undur_diri_surat_permohonan: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async createDokumen(
    @UploadedFiles()
    files: {
      dok_undur_diri_keputusan_pengangkatan?: Express.Multer.File[];
      dok_undur_diri_keputusan_kenaikan_pangkat?: Express.Multer.File[];
      dok_undur_diri_ktp_ppns?: Express.Multer.File[];
      dok_undur_diri_surat_persetujuan?: Express.Multer.File[];
      dok_undur_diri_surat_permohonan?: Express.Multer.File[];
    },
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ) {
    const authorization = headers['authorization'] || '';
    const request = {
      ...body,
      dok_undur_diri_keputusan_pengangkatan:
        files?.dok_undur_diri_keputusan_pengangkatan?.[0] ?? null,
      dok_undur_diri_keputusan_kenaikan_pangkat:
        files?.dok_undur_diri_keputusan_kenaikan_pangkat?.[0] ?? null,
      dok_undur_diri_ktp_ppns: files?.dok_undur_diri_ktp_ppns?.[0] ?? null,
      dok_undur_diri_surat_persetujuan:
        files?.dok_undur_diri_surat_persetujuan?.[0] ?? null,
      dok_undur_diri_surat_permohonan:
        files?.dok_undur_diri_surat_permohonan?.[0] ?? null,
    };

    const result = await this.pemberhentianUndurDiriService.storeUploadDokumen(
      request,
      authorization,
    );
    return { statusCode: 201, message: 'Success', data: result };
  }
}
