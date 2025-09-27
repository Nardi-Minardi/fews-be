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
  CreateResponsePengangkatanPpnsDto,
  CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto,
} from './dto/create.pengangkatan.dto';
import { PengangkatanService } from './pengangkatan.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Pengangkatan')
@Controller('/pengangkatan')
export class PengangkatanController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private pengangkatanService: PengangkatanService,
  ) {}

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'dok_tanda_terima_polisi', maxCount: 1 },
      { name: 'dok_tanda_terima_kejaksaan_agung', maxCount: 1 },
    ]),
  )
  @Post('/create')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create Pengangkatan' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id_data_ppns: {
          type: 'number',
          example: 12345,
        },
        nama_sekolah: {
          type: 'string',
          example: 'Institut Pemerintahan Dalam Negeri',
        },
        gelar_terakhir: {
          type: 'string',
          example: 'S2',
        },
        no_ijazah: {
          type: 'string',
          example: 'IJZ-12345',
        },
        tgl_ijazah: {
          type: 'string',
          format: 'date',
          example: '2023-06-12',
        },
        tahun_lulus: {
          type: 'number',
          example: 2023,
        },
        no_sttpl: {
          type: 'string',
          example: 'STTPL-12345',
        },
        tgl_sttpl: {
          type: 'string',
          format: 'date',
          example: '2023-06-12',
        },
        tgl_verifikasi: {
          type: 'string',
          format: 'date',
          example: '2023-06-12',
        },
        teknis_operasional_penegak_hukum: {
          type: 'string',
          example: 'true',
        },
        jabatan : {
          type: 'string',
          example: 'Penyidik',
        },
        cek_surat_polisi: {
          type: 'string',
          example: 'false',
        },
        no_surat_polisi: {
          type: 'string',
          example: 'SP-12345',
        },
        tgl_surat_polisi: {
          type: 'string',
          format: 'date',
          example: '2023-06-12',
        },
        perihal_surat_polisi: {
          type: 'string',
          example: 'Permohonan Pengangkatan PPNS',
        },
        no_tanda_terima_polisi: {
          type: 'string',
        },
        tgl_tanda_terima_polisi: {
          type: 'string',
          format: 'date',
        },
        perihal_tanda_terima_polisi: {
          type: 'string',
        },
        dok_tanda_terima_polisi: {
          type: 'string',
          format: 'binary',
        },
        cek_surat_kejaksaan_agung: {
          type: 'string',
          example: 'false',
        },
        no_surat_kejaksaan_agung: {
          type: 'string',
          example: 'SA-12345',
        },
        tgl_surat_kejaksaan_agung: {
          type: 'string',
          format: 'date',
          example: '2023-06-12',
        },
        perihal_surat_kejaksaan_agung: {
          type: 'string',
          example: 'Permohonan Pengangkatan PPNS',
        },
        no_tanda_terima_kejaksaan_agung: {
          type: 'string',
        },
        tgl_tanda_terima_kejaksaan_agung: {
          type: 'string',
          format: 'date',
        },
        perihal_tanda_terima_kejaksaan_agung: {
          type: 'string',
        },
        dok_tanda_terima_kejaksaan_agung: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async createPengangkatanPpns(
    @UploadedFiles()
    files: {
      dok_tanda_terima_polisi?: Express.Multer.File[];
      dok_tanda_terima_kejaksaan_agung?: Express.Multer.File[];
    },
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<CreateResponsePengangkatanPpnsDto>> {
    const authorization = headers['authorization'] || '';
    const request = {
      ...body,
      dok_tanda_terima_polisi: files?.dok_tanda_terima_polisi?.[0] ?? null,
      dok_tanda_terima_kejaksaan_agung:
        files?.dok_tanda_terima_kejaksaan_agung?.[0] ?? null,
    };

    const result = await this.pengangkatanService.storePengangkatanPpns(
      request,
      authorization,
    );

    return { statusCode: 201, message: 'Success', data: result };
  }

  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'dok_surat_permohonan_pengangkatan', maxCount: 1 },
      { name: 'dok_fotokopi_tamat_pendidikan', maxCount: 1 },
      { name: 'dok_surat_pertimbangan', maxCount: 1 },
      { name: 'foto', maxCount: 1 },
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
        dok_surat_permohonan_pengangkatan: {
          type: 'string',
          format: 'binary',
        },
        dok_fotokopi_tamat_pendidikan: {
          type: 'string',
          format: 'binary',
        },
        dok_surat_pertimbangan: {
          type: 'string',
          format: 'binary',
        },
        foto: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async createDokumen(
    @UploadedFiles()
    files: {
      dok_surat_permohonan_pengangkatan?: Express.Multer.File[];
      dok_fotokopi_tamat_pendidikan?: Express.Multer.File[];
      dok_surat_pertimbangan?: Express.Multer.File[];
      foto?: Express.Multer.File[];
    },
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ): Promise<
    WebResponse<CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto>
  > {
    const authorization = headers['authorization'] || '';
    const request = {
      ...body,
      dok_surat_permohonan_pengangkatan:
        files?.dok_surat_permohonan_pengangkatan?.[0] ?? null,
      dok_fotokopi_tamat_pendidikan:
        files?.dok_fotokopi_tamat_pendidikan?.[0] ?? null,
      dok_surat_pertimbangan: files?.dok_surat_pertimbangan?.[0] ?? null,
      foto: files?.foto?.[0] ?? null,
    };

    const result = await this.pengangkatanService.storeUploadDokumen(
      request,
      authorization,
    );

    return { statusCode: 201, message: 'Success', data: result };
  }
}
