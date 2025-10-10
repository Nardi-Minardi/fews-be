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
  CreateResponsePelantikanPpnsDto,
  CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto,
} from './dto/create.pelantikan.dto';
import { PelantikanService } from './pelantikan.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Pelantikan')
@Controller('/pelantikan')
export class PelantikanController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private pelantikanService: PelantikanService,
  ) {}

  @Post('/create')
  @ApiOperation({ summary: 'Create Pelantikan' })
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
            no_surat: {
              type: 'string',
              description: 'Nomor surat permohonan',
              example: '123/ABC/2025',
            },
            tgl_surat: {
              type: 'string',
              format: 'date',
              description: 'Tanggal surat permohonan (yyyy-mm-dd)',
              example: '2025-09-17',
            },
          },
        },
        surat_ket_pengangkatan: {
          type: 'object',
          description: 'Data surat keterangan pengangkatan',
          properties: {
            no_sk_induk: {
              type: 'string',
              description: 'Nomor SK induk',
              example: 'SK-456/XYZ/20',
            },
            tgl_sk_induk: {
              type: 'string',
              format: 'date',
              description: 'Tanggal SK induk (yyyy-mm-dd)',
              example: '2025-09-01',
            },
          },
        },
      },
    },
  })
  @HttpCode(201)
  async createPelantikan(
    @Body() request,
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<CreateResponsePelantikanPpnsDto>> {
    const authorization = headers['authorization'] || '';

    const result = await this.pelantikanService.storePelantikan(
      request,
      authorization,
    );

    return { statusCode: 201, message: 'Success', data: result };
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'dok_pelantikan_surat_permohonan', maxCount: 1 },
      { name: 'dok_pelantikan_sk_menteri', maxCount: 1 },
      { name: 'dok_pelantikan_lampiran_menteri', maxCount: 1 },
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
        dok_pelantikan_surat_permohonan: {
          type: 'string',
          format: 'binary',
        },
        dok_pelantikan_sk_menteri: {
          type: 'string',
          format: 'binary',
        },
        dok_pelantikan_lampiran_menteri: {
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
      dok_pelantikan_surat_permohonan?: Express.Multer.File[];
      dok_pelantikan_sk_menteri?: Express.Multer.File[];
      dok_pelantikan_lampiran_menteri?: Express.Multer.File[];
    },
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ): Promise<
    WebResponse<CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto>
  > {
    const authorization = headers['authorization'] || '';
    const request = {
      ...body,
      dok_pelantikan_surat_permohonan:
        files?.dok_pelantikan_surat_permohonan?.[0] ?? null,
      dok_pelantikan_sk_menteri: files?.dok_pelantikan_sk_menteri?.[0] ?? null,
      dok_pelantikan_lampiran_menteri:
        files?.dok_pelantikan_lampiran_menteri?.[0] ?? null,
    };

    const result = await this.pelantikanService.storeUploadDokumen(
      request,
      authorization,
    );

    return { statusCode: 201, message: 'Success', data: result };
  }
}
