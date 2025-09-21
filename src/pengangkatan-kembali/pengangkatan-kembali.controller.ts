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
  CreateResponsePengangkatanKembaliPpnsDto,
  CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto,
} from './dto/create.pengangkatan-kembali.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PengangkatanKembaliService } from './pengangkatan-kembali.service';

@Controller('/pengangkatan-kembali')
export class PengangkatanKembaliController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private pengangkatanKembaliService: PengangkatanKembaliService,
  ) {}

  @Post('/create')
  @HttpCode(201)
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
