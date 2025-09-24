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

@Controller('/pemberhentian-pensiun')
export class PemberhentianPensiunController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private pemberhentianPensiunService: PemberhentianPensiunService,
  ) {}

  @Post('/create')
  @HttpCode(201)
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
      dok_pensiun_sk_bkn:
        files?.dok_pensiun_sk_bkn?.[0] ?? null,
    };

    const result = await this.pemberhentianPensiunService.storeUploadDokumen(
      request,
      authorization,
    );
    return { statusCode: 201, message: 'Success', data: result };
  }
}
