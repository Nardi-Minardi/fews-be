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
import { CreateResponseNtoPpnsDto } from './dto/create.pemberhentian-nto.dto';
import { PemberhentianNtoService } from './pemberhentian-nto.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Pemberhentian NTO')
@Controller('/pemberhentian-nto')
export class PemberhentianNtoController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private pemberhentianNtoService: PemberhentianNtoService,
  ) {}

  @Post('/create')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create Pemberhentian NTO' })
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
        sk_pemberhentian: {
          type: 'object',
          description: 'Surat keputusan pemberhentian PNS',
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
  async createPensiun(
    @Body() request,
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<CreateResponseNtoPpnsDto>> {
    const authorization = headers['authorization'] || '';

    const result = await this.pemberhentianNtoService.storeNto(
      request,
      authorization,
    );

    return { statusCode: 201, message: 'Success', data: result };
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'dok_nto_keputusan_pengangkatan', maxCount: 1 },
      { name: 'dok_nto_keputusan_kenaikan', maxCount: 1 },
      { name: 'dok_nto_ktp_ppns', maxCount: 1 },
      { name: 'dok_nto_pemberitahuan_pemberhentian', maxCount: 1 },
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
        dok_nto_keputusan_pengangkatan: {
          type: 'string',
          format: 'binary',
        },
        dok_nto_keputusan_kenaikan: {
          type: 'string',
          format: 'binary',
        },
        dok_nto_ktp_ppns: {
          type: 'string',
          format: 'binary',
        },
        dok_nto_pemberitahuan_pemberhentian: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async createDokumen(
    @UploadedFiles()
    files: {
      dok_nto_keputusan_pengangkatan?: Express.Multer.File[];
      dok_nto_keputusan_kenaikan?: Express.Multer.File[];
      dok_nto_ktp_ppns?: Express.Multer.File[];
      dok_nto_pemberitahuan_pemberhentian?: Express.Multer.File[];
    },
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ) {
    const authorization = headers['authorization'] || '';
    const request = {
      ...body,
      dok_nto_keputusan_pengangkatan:
        files?.dok_nto_keputusan_pengangkatan?.[0] ?? null,
      dok_nto_keputusan_kenaikan:
        files?.dok_nto_keputusan_kenaikan?.[0] ?? null,
      dok_nto_ktp_ppns: files?.dok_nto_ktp_ppns?.[0] ?? null,
      dok_nto_pemberitahuan_pemberhentian:
        files?.dok_nto_pemberitahuan_pemberhentian?.[0] ?? null,
    };

    const result = await this.pemberhentianNtoService.storeUploadDokumen(
      request,
      authorization,
    );
    return { statusCode: 201, message: 'Success', data: result };
  }
}
