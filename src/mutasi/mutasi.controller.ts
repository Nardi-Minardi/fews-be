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
  CreateResponseMutasiPpnsDto,
  CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto,
} from './dto/create.mutasi.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { MutasiService } from './mutasi.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Mutasi')
@Controller('/mutasi')
export class MutasiController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private mutasiService: MutasiService,
  ) {}

  @Post('/create')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create Mutasi' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id_data_ppns: {
          type: 'number',
          description: 'ID calon PPNS',
          example: 12345,
        },
        surat_permohonan: {
          type: 'object',
          description: 'Data surat permohonan',
          properties: {
            tgl_surat: {
              type: 'string',
              format: 'date',
              description: 'Tanggal surat permohonan (yyyy-mm-dd)',
              example: '2025-09-20',
            },
            no_surat: {
              type: 'string',
              description: 'Nomor surat permohonan',
              example: 'SP-001/IX/2025',
            },
          },
        },
        surat_keputusan_pangkat: {
          type: 'object',
          description: 'Data surat keputusan pangkat',
          properties: {
            tgl_keputusan_pangkat: {
              type: 'string',
              format: 'date',
              description: 'Tanggal keputusan pangkat (yyyy-mm-dd)',
              example: '2025-08-15',
            },
            no_keputusan_pangkat: {
              type: 'string',
              description: 'Nomor keputusan pangkat',
              example: 'KP-2025-001',
            },
          },
        },
        surat_keputusan_kenaikan_pangkat: {
          type: 'object',
          description: 'Data surat keputusan kenaikan pangkat',
          properties: {
            tgl_keputusan_kenaikan_pangkat: {
              type: 'string',
              format: 'date',
              description: 'Tanggal keputusan kenaikan pangkat (yyyy-mm-dd)',
              example: '2025-09-01',
            },
            no_keputusan_kenaikan_pangkat: {
              type: 'string',
              description: 'Nomor keputusan kenaikan pangkat',
              example: 'KNP-2025-045',
            },
          },
        },
        surat_sk_mutasi_wilayah_kerja: {
          type: 'object',
          description: 'Data surat SK mutasi wilayah kerja',
          properties: {
            tgl_sk_mutasi_wilayah_kerja: {
              type: 'string',
              format: 'date',
              description: 'Tanggal SK mutasi wilayah kerja (yyyy-mm-dd)',
              example: '2025-09-10',
            },
            no_sk_mutasi_wilayah_kerja: {
              type: 'string',
              description: 'Nomor SK mutasi wilayah kerja',
              example: 'MWK-2025-012',
            },
          },
        },
      },
    },
  })
  async createMutasi(
    @Body() request,
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<CreateResponseMutasiPpnsDto>> {
    const authorization = headers['authorization'] || '';

    const result = await this.mutasiService.storeMutasi(request, authorization);

    return { statusCode: 201, message: 'Success', data: result };
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'dok_mutasi_keputusan_pengangkatan', maxCount: 1 },
      { name: 'dok_mutasi_keputusan_kenaikan_pangkat', maxCount: 1 },
      { name: 'dok_mutasi_sk_mutasi', maxCount: 1 },
      { name: 'mutasi_pas_foto', maxCount: 1 },
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
        dok_mutasi_keputusan_pengangkatan: {
          type: 'string',
          format: 'binary',
        },
        dok_mutasi_keputusan_kenaikan_pangkat: {
          type: 'string',
          format: 'binary',
        },
        dok_mutasi_sk_mutasi: {
          type: 'string',
          format: 'binary',
        },
        mutasi_pas_foto: {
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
      dok_mutasi_keputusan_pengangkatan?: Express.Multer.File[];
      dok_mutasi_keputusan_kenaikan_pangkat?: Express.Multer.File[];
      dok_mutasi_sk_mutasi?: Express.Multer.File[];
      mutasi_pas_foto?: Express.Multer.File[];
    },
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ) {
    const authorization = headers['authorization'] || '';
    const request = {
      ...body,
      dok_mutasi_keputusan_pengangkatan:
        files?.dok_mutasi_keputusan_pengangkatan?.[0] ?? null,
      dok_mutasi_keputusan_kenaikan_pangkat:
        files?.dok_mutasi_keputusan_kenaikan_pangkat?.[0] ?? null,
      dok_mutasi_sk_mutasi: files?.dok_mutasi_sk_mutasi?.[0] ?? null,
      mutasi_pas_foto: files?.mutasi_pas_foto?.[0] ?? null,
    };

    const result = await this.mutasiService.storeUploadDokumen(
      request,
      authorization,
    );
    return { statusCode: 201, message: 'Success', data: result };
  }
}
