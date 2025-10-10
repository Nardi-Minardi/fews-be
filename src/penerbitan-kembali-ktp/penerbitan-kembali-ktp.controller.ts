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
import { PenerbitanKembaliKtpService } from './penerbitan-kembali-ktp.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Penerbitan Kembali KTP')
@Controller('/penerbitan-kembali-ktp')
export class PenerbitanKembaliKtpController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private penerbitanKembaliKtpService: PenerbitanKembaliKtpService,
  ) {}

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'dok_penerbitan_kembali_ktp_surat_kehilangan', maxCount: 1 },
      { name: 'dok_penerbitan_kembali_ktp_ktp_rusak', maxCount: 1 },
      { name: 'penerbitan_kembali_ktp_pas_foto', maxCount: 1 },
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
        dok_penerbitan_kembali_ktp_surat_kehilangan: {
          type: 'string',
          format: 'binary',
        },
        dok_penerbitan_kembali_ktp_ktp_rusak: {
          type: 'string',
          format: 'binary',
        },
        penerbitan_kembali_ktp_pas_foto: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async createDokumen(
    @UploadedFiles()
    files: {
      dok_penerbitan_kembali_ktp_surat_kehilangan?: Express.Multer.File[];
      dok_penerbitan_kembali_ktp_ktp_rusak?: Express.Multer.File[];
      penerbitan_kembali_ktp_pas_foto?: Express.Multer.File[];
    },
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ) {
    const authorization = headers['authorization'] || '';
    const request = {
      ...body,
      dok_penerbitan_kembali_ktp_surat_kehilangan:
        files?.dok_penerbitan_kembali_ktp_surat_kehilangan?.[0] ?? null,
      dok_penerbitan_kembali_ktp_ktp_rusak:
        files?.dok_penerbitan_kembali_ktp_ktp_rusak?.[0] ?? null,
      penerbitan_kembali_ktp_pas_foto:
        files?.penerbitan_kembali_ktp_pas_foto?.[0] ?? null,
    };

    const result = await this.penerbitanKembaliKtpService.storeUploadDokumen(
      request,
      authorization,
    );
    return { statusCode: 201, message: 'Success', data: result };
  }
}
