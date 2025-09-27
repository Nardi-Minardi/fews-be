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
import { CreateResponsePerpanjangKtpPpnsDto } from './dto/create.perpanjang-ktp.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PerpanjangKtpService } from './perpanjang-ktp.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Perpanjang KTP')
@Controller('/perpanjang-ktp')
export class PerpanjangKtpController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private perpanjangKtpService: PerpanjangKtpService,
  ) {}

  @Post('/create')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create Perpanjang KTP' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id_data_ppns: {
          type: 'number',
          description: 'ID calon PPNS yang valid',
          example: 12345,
        },
        kartu_tanda_penyidik: {
          type: 'object',
          description: 'Data kartu tanda penyidik',
          properties: {
            tgl_berlaku_ktp: {
              type: 'string',
              format: 'date',
              description: 'Tanggal berlaku KTP (yyyy-mm-dd)',
              example: '2025-09-22',
            },
            tgl_ktp: {
              type: 'string',
              format: 'date',
              description: 'Tanggal terbit KTP (yyyy-mm-dd)',
              example: '2025-01-15',
            },
            no_ktp: {
              type: 'string',
              description: 'Nomor KTP',
              example: '1234567890123456',
            },
          },
        },
        surat_petikan: {
          type: 'object',
          description: 'Data surat petikan',
          properties: {
            tgl_surat_petikan: {
              type: 'string',
              format: 'date',
              description: 'Tanggal surat petikan (yyyy-mm-dd)',
              example: '2025-09-01',
            },
            no_surat_petikan: {
              type: 'string',
              description: 'Nomor surat petikan',
              example: 'SP-2025-001',
            },
          },
        },
      },
    },
  })
  async createPerpanjangKtp(
    @Body() request,
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<CreateResponsePerpanjangKtpPpnsDto>> {
    const authorization = headers['authorization'] || '';

    const result = await this.perpanjangKtpService.storePerpanjangKtp(
      request,
      authorization,
    );

    return { statusCode: 201, message: 'Success', data: result };
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'dok_perpanjangan_ktp_sk_petikan', maxCount: 1 },
      { name: 'dok_perpanjangan_ktp_fotocopy_ktp', maxCount: 1 },
      { name: 'dok_perpanjangan_ktp_berita_acara', maxCount: 1 },
      { name: 'perpanjangan_ktp_pas_foto', maxCount: 1 },
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
        dok_perpanjangan_ktp_sk_petikan: {
          type: 'string',
          format: 'binary',
        },
        dok_perpanjangan_ktp_fotocopy_ktp: {
          type: 'string',
          format: 'binary',
        },
        dok_perpanjangan_ktp_berita_acara: {
          type: 'string',
          format: 'binary',
        },
        perpanjangan_ktp_pas_foto: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async createDokumen(
    @UploadedFiles()
    files: {
      dok_perpanjangan_ktp_sk_petikan?: Express.Multer.File[];
      dok_perpanjangan_ktp_fotocopy_ktp?: Express.Multer.File[];
      dok_perpanjangan_ktp_berita_acara?: Express.Multer.File[];
      perpanjangan_ktp_pas_foto?: Express.Multer.File[];
    },
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ) {
    const authorization = headers['authorization'] || '';
    const request = {
      ...body,
      dok_perpanjangan_ktp_sk_petikan:
        files?.dok_perpanjangan_ktp_sk_petikan?.[0] ?? null,
      dok_perpanjangan_ktp_fotocopy_ktp:
        files?.dok_perpanjangan_ktp_fotocopy_ktp?.[0] ?? null,
      dok_perpanjangan_ktp_berita_acara:
        files?.dok_perpanjangan_ktp_berita_acara?.[0] ?? null,
      perpanjangan_ktp_pas_foto: files?.perpanjangan_ktp_pas_foto?.[0] ?? null,
    };

    const result = await this.perpanjangKtpService.storeUploadDokumen(
      request,
      authorization,
    );
    return { statusCode: 201, message: 'Success', data: result };
  }
}
