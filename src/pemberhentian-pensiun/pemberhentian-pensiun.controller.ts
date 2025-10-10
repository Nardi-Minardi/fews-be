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
import { PemberhentianPensiunService } from './pemberhentian-pensiun.service';
import { CreateResponsePensiunPpnsDto } from './dto/create.pemberhentian-pensiun.dto';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Pemberhentian Pensiun')
@Controller('/pemberhentian-pensiun')
export class PemberhentianPensiunController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private pemberhentianPensiunService: PemberhentianPensiunService,
  ) {}

  @Post('/create')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create Pemberhentian Pensiun' })
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
              example: '2020-01-15',
            },
            no_sk_pengangkatan_pns: {
              type: 'string',
              description: 'Nomor SK pengangkatan PNS',
              example: 'SKPNS-2020-001',
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
              example: '2022-05-10',
            },
            no_sk_kenaikan_pangkat: {
              type: 'string',
              description: 'Nomor SK kenaikan pangkat',
              example: 'SKKP-2022-002',
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
              example: '3201010101010001',
            },
          },
        },
        sk_bkn: {
          type: 'object',
          description: 'Surat keputusan dari BKN',
          properties: {
            tgl_sk_bkn: {
              type: 'string',
              format: 'date',
              description: 'Tanggal SK BKN (yyyy-mm-dd)',
              example: '2024-08-20',
            },
            no_sk_bkn: {
              type: 'string',
              description: 'Nomor SK BKN',
              example: 'SKBKN-2024-005',
            },
          },
        },
      },
    },
  })
  async createPensiun(
    @Body() request,
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<CreateResponsePensiunPpnsDto>> {
    const authorization = headers['authorization'] || '';

    const result = await this.pemberhentianPensiunService.storePensiun(
      request,
      authorization,
    );

    return { statusCode: 201, message: 'Success', data: result };
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'dok_pensiun_keputusan_pengangkatan', maxCount: 1 },
      { name: 'dok_pensiun_keputusan_kenaikan', maxCount: 1 },
      { name: 'dok_pensiun_ktp_ppns', maxCount: 1 },
      { name: 'dok_pensiun_sk_bkn', maxCount: 1 },
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
        dok_pensiun_keputusan_pengangkatan: {
          type: 'string',
          format: 'binary',
        },
        dok_pensiun_keputusan_kenaikan: {
          type: 'string',
          format: 'binary',
        },
        dok_pensiun_ktp_ppns: {
          type: 'string',
          format: 'binary',
        },
        dok_pensiun_sk_bkn: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async createDokumen(
    @UploadedFiles()
    files: {
      dok_pensiun_keputusan_pengangkatan?: Express.Multer.File[];
      dok_pensiun_keputusan_kenaikan?: Express.Multer.File[];
      dok_pensiun_ktp_ppns?: Express.Multer.File[];
      dok_pensiun_sk_bkn?: Express.Multer.File[];
    },
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ) {
    const authorization = headers['authorization'] || '';
    const request = {
      ...body,
      dok_pensiun_keputusan_pengangkatan:
        files?.dok_pensiun_keputusan_pengangkatan?.[0] ?? null,
      dok_pensiun_keputusan_kenaikan:
        files?.dok_pensiun_keputusan_kenaikan?.[0] ?? null,
      dok_pensiun_ktp_ppns: files?.dok_pensiun_ktp_ppns?.[0] ?? null,
      dok_pensiun_sk_bkn: files?.dok_pensiun_sk_bkn?.[0] ?? null,
    };

    const result = await this.pemberhentianPensiunService.storeUploadDokumen(
      request,
      authorization,
    );
    return { statusCode: 201, message: 'Success', data: result };
  }
}
