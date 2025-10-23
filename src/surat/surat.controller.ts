import {
  Body,
  Controller,
  Headers,
  Inject,
  NotFoundException,
  Param,
  Post,
  Get,
  Query,
  HttpCode,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { Pagination, WebResponse } from 'src/common/web.response';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { getUserFromToken } from 'src/common/utils/helper.util';
import {
  GetCalonPemohonPaginationDto,
  ListCalonPemohon,
  ListSurat,
} from './dto/get.surat.dto';
import {
  CreateResponsePpnsDataPnsDto,
  CreateResponseSendVerifikatorDto,
  CreateResponseSuratDto,
} from './dto/create.surat.dto';
import { SuratRepository } from './surat.repository';
import { SuratService } from './surat.service';
import { PrismaService, MasterPrismaService } from 'src/common/prisma.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Surat dan Calon PPNS')
@Controller('/surat')
export class SuratController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly prismaService: PrismaService,
    private suratService: SuratService,
    private suratRepository: SuratRepository,
    private masterPrismaService: MasterPrismaService,
  ) {}

  @ApiOperation({ summary: 'Get all surat (ownership by login)' })
  @Get('/')
  @HttpCode(200)
  // @RedisCache('badan-usaha-perubahan-cv-list', 60)
  async getAllSurat(
    @Query('layanan') layanan: string,
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('orderBy') orderBy: string | null,
    @Query('orderDirection') orderDirection: 'asc' | 'desc' | null,
    @Query('filters') filters: string | null,
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<ListSurat[], Pagination>> {
    let parsedFilters: Record<string, any> = {};
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters); // langsung jadi object
      } catch (e) {
        console.warn('Invalid filters JSON:', filters);
      }
    }
    const authorization = headers['authorization'] || '';

    const result = await this.suratService.getListSurat(
      {
        layanan,
        search,
        page,
        limit,
        orderBy,
        orderDirection,
        filters: parsedFilters,
      },
      authorization,
    );
    return {
      statusCode: 200,
      message: 'Success',
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('/calon-ppns/:id_surat')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get detail calon ppns by id surat' })
  async detailCalonPpns(
    @Param('id_surat') id_surat: string,
    @Headers() headers: Record<string, any>,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ): Promise<any> {
    // ✅ ubah ke any
    const authorization = headers['authorization'] || '';
    const userLogin = await getUserFromToken(authorization);
    if (!userLogin) {
      throw new BadRequestException('Authorization is missing');
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    // Ambil total data dulu
    const totalData = await this.suratRepository.countPpnsDataPnsByIdSurat(
      Number(id_surat),
    );

    // Ambil data berdasarkan pagination
    const item = await this.suratRepository.findPpnsDataPnsByIdSurat(
      Number(id_surat),
      limitNum,
      offset,
    );

    console.log('item calon ppns', item);

    if (!item || item.length === 0) {
      throw new BadRequestException('Ppns Surat not found');
    }

    const mappedItem: any[] = [];
    for (const calon of item) {
      const dataAgama = await this.masterPrismaService.agama.findFirst({
        where: { id_agama: calon.agama || undefined },
      });
      const dataPangkatGolongan =
        await this.prismaService.ppnsPangkatGolongan.findFirst({
          where: {
            id: calon.pangkat_golongan
              ? Number(calon.pangkat_golongan)
              : undefined,
          },
        });

      mappedItem.push({
        id: calon.id || null,
        id_surat: calon.id_surat || null,
        no_surat: calon.ppns_surat?.no_surat || null,
        nama: calon.nama || null,
        nip: calon.nip || null,
        nama_gelar: calon.nama_gelar || null,
        jabatan: calon.jabatan || null,
        pangkat_golongan: calon.pangkat_golongan || null,
        data_pangkat_golongan: dataPangkatGolongan || null,
        jenis_kelamin: calon.jenis_kelamin || null,
        agama: calon.agama || null,
        data_agama: dataAgama,
        nama_sekolah: calon.nama_sekolah || null,
        gelar_terakhir: calon.gelar_terakhir || null,
        no_ijazah: calon.no_ijazah || null,
        tgl_ijazah: calon.tgl_ijazah ? calon.tgl_ijazah.toISOString() : null,
        tahun_lulus: calon.tahun_lulus || null,
        ppns_wilayah_kerja: calon.ppns_wilayah_kerja.map((wilayah) => ({
          id: wilayah.id || null,
          id_ppns: wilayah.id_ppns || null,
          id_surat: wilayah.id_surat || null,
          uu_dikawal: [
            wilayah.uu_dikawal_1,
            wilayah.uu_dikawal_2,
            wilayah.uu_dikawal_3,
          ].filter((uu): uu is string => !!uu),
        })),
      });
    }

    const totalPage = Math.ceil(totalData / limitNum);

    return {
      statusCode: 200,
      message: 'Success',
      status_kirim_verifikator: item[0]?.ppns_surat?.status
        ? item[0]?.ppns_surat?.status
        : false,
      data: mappedItem,
      pagination: {
        currentPage: pageNum,
        totalPage,
        totalData,
      },
    };
  }

  //create surat
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'dok_surat_pernyataan', maxCount: 1 }]),
  )
  @Post('/create')
  @ApiOperation({ summary: 'Create surat' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        lembaga_kementerian: {
          type: 'number',
          example: 12345,
        },
        instansi: {
          type: 'number',
          example: 12345,
        },
        tgl_surat: {
          type: 'string',
          format: 'date',
          example: '2023-10-10',
        },
        no_surat: {
          type: 'string',
          example: 'XYZ/123/PPNS/2023',
        },
        no_surat_verifikasi_sebelumnya: {
          type: 'string',
          example: 'SRT-Verifkasi-1',
        },
        perihal: {
          type: 'string',
          example: 'Permohonan PPNS XYZ',
        },
        nama_pengusul: {
          type: 'string',
          example: 'John Doe',
        },
        jabatan_pengusul: {
          type: 'string',
          example: 'Manager',
        },
        dok_surat_pernyataan: {
          type: 'string',
          format: 'binary',
        },
        layanan: {
          type: 'string',
          example: 'verifikasi',
        },
      },
    },
  })
  @HttpCode(201)
  async createSurat(
    @UploadedFiles()
    files: {
      dok_surat_pernyataan?: Express.Multer.File[];
    },
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<CreateResponseSuratDto>> {
    const authorization = headers['authorization'] || '';
    const request = {
      ...body,
      dok_surat_pernyataan: files?.dok_surat_pernyataan?.[0] ?? null,
    };

    const result = await this.suratService.storeSurat(request, authorization);

    return { statusCode: 201, message: 'Success', data: result };
  }

  @Post('/calon-ppns/create')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create calon ppns/data ppns' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'ID calon PNS (optional, hanya untuk update)',
          example: 12345,
        },
        id_surat: {
          type: 'number',
          description: 'ID surat terkait',
          example: 12345,
        },
        identitas_pns: {
          type: 'object',
          description: 'Data identitas PNS',
          properties: {
            nama: { type: 'string', example: 'Budi Santoso' },
            nip: { type: 'string', example: '198765432109876543' },
            nama_gelar: {
              type: 'string',
              example: 'Dr. Budi Santoso, S.H., M.H.',
            },
            gelar_depan: { type: 'string', example: 'Dr. SH' },
            gelar_belakang: { type: 'string', example: 'S.H., M.H.' },
            jabatan: {
              type: 'string',
              example: 'Penyidik Pegawai Negeri Sipil',
            },
            pangkat_golongan: { type: 'string', example: '1' },
            jenis_kelamin: { type: 'string', example: 'Pria' },
            agama: { type: 'number', example: 1 },
            nomor_hp: { type: 'string', example: '081287800921' },
            email: { type: 'string', example: 'budi_santoso@gmail.com' },
          },
        },
        wilayah_kerja: {
          type: 'array',
          description: 'Daftar wilayah kerja',
          items: {
            type: 'object',
            properties: {
              provinsi: { type: 'string', example: '31' },
              kab_kota: { type: 'string', example: '3172' },
              kecamatan: { type: 'string', example: '317401' },
              uu_dikawal: {
                type: 'array',
                items: { type: 'string', example: '1' },
              },
            },
          },
        },
        lokasi_penempatan: {
          type: 'object',
          description: 'Lokasi penempatan PNS',
          properties: {
            provinsi_penempatan: { type: 'string', example: '31' },
            kabupaten_penempatan: { type: 'string', example: '3172' },
            unit_kerja: { type: 'string', example: 'Satpol PP Jawa Tengah' },
          },
        },
      },
    },
  })
  async createCalonPpns(
    @Body() request,
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<CreateResponsePpnsDataPnsDto>> {
    const authorization = headers['authorization'] || '';
    const result = await this.suratService.storeCalonPpns(
      request,
      authorization,
    );

    return { statusCode: 201, message: 'Success', data: result };
  }

  @Post('/send-to-verifikator')
  @HttpCode(201)
  @ApiOperation({ summary: 'Send surat to verifikator' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id_surat: {
          type: 'number',
          example: 12345,
        },
      },
    },
  })
  async sendToVerifikator(
    @Body() request,
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<CreateResponseSendVerifikatorDto>> {
    const authorization = headers['authorization'] || '';
    const result = await this.suratService.doSendVerifikator(
      request,
      authorization,
    );

    return { statusCode: 201, message: 'Success', data: result };
  }

  @Delete('/delete/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Surat - Delete' })
  async deleteSurat(
    @Param('id') id: number,
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<{ message: string }>> {
    const authorization = headers['authorization'] || '';
    if (!id) {
      throw new BadRequestException('id is required');
    }

    //get boLaporan by id pm
    const pmCv = await this.suratRepository.findPpnSuratById(Number(id));
    if (!pmCv) {
      throw new NotFoundException('Surat tidak ditemukan');
    }

    await this.suratRepository.deletePpnsSurat(Number(id));
    return {
      statusCode: 200,
      message: 'Success',
      data: { message: 'Surat berhasil dihapus' },
    };
  }

  @Delete('/calon-pppns/delete/:id_ppns')
  @HttpCode(200)
  @ApiOperation({ summary: 'Calon PPNS - Delete' })
  async deleteCalonPpns(
    @Param('id_ppns') id_ppns: number,
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<{ message: string }>> {
    const authorization = headers['authorization'] || '';
    if (!id_ppns) {
      throw new BadRequestException('id_ppns is required');
    }

    //get boLaporan by id pm
    const pmCv = await this.suratRepository.findPpnsDataPnsById(
      Number(id_ppns),
    );
    if (!pmCv) {
      throw new NotFoundException('Calon Pemohon tidak ditemukan');
    }

    await this.suratRepository.deleteDataPpns(Number(id_ppns));
    return {
      statusCode: 200,
      message: 'Success',
      data: { message: 'Calon Pemohon berhasil dihapus' },
    };
  }
}
