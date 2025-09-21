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

@Controller('/mutasi')
export class MutasiController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private mutasiService: MutasiService,
  ) {}

  @Post('/create')
  @HttpCode(201)
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
