import {
  Body,
  Controller,
  Headers,
  Inject,
  Post,
  HttpCode,
  UseInterceptors,
  UploadedFiles,
  Get,
  Query,
  Param,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { Pagination, WebResponse } from 'src/common/web.response';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ListDaftarVerifikasi } from './dto/get.admin.dto';
import { PrismaService, MasterPrismaService } from 'src/common/prisma.service';
import { status_enum, verifikasi_enum } from '.prisma/main-client';
import { AdminValidation } from './admin.validation';
import { Http } from 'winston/lib/winston/transports';
import { getUserFromToken } from 'src/common/utils/helper.util';
import { SuratRepository } from 'src/surat/surat.repository';
import { AdminRepository } from './admin.repository';

@ApiTags('Admin')
@Controller('/daftar-verifikasi')
export class AdminController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private adminService: AdminService,
    private prismaService: PrismaService,
    private suratRepository: SuratRepository,
    private masterPrismaService: MasterPrismaService,
    private adminRepository: AdminRepository,
  ) {}

  @ApiOperation({ summary: 'Get Daftar Transaksi' })
  @Get('/')
  @HttpCode(200)
  // @RedisCache('badan-usaha-perubahan-cv-list', 60)
  async getAllSurat(
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('orderBy') orderBy: string | null,
    @Query('orderDirection') orderDirection: 'asc' | 'desc' | null,
    @Query('filters') filters: string | null,
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<ListDaftarVerifikasi[], Pagination>> {
    let parsedFilters: Record<string, any> = {};
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters); // langsung jadi object
      } catch (e) {
        console.warn('Invalid filters JSON:', filters);
      }
    }
    const authorization = headers['authorization'] || '';

    const result = await this.adminService.getListDaftarVerifikasi(
      {
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

  //detail
  @ApiOperation({ summary: 'Get Detail Transasi by ID' })
  @Get('/detail/:id')
  @HttpCode(200)
  // @RedisCache('badan-usaha-perubahan-cv-list', 60)
  async getDetailTransasiById(
    @Param('id') id: string,
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<any>> {
    const authorization = headers['authorization'] || '';
    const result = await this.prismaService.ppnsSurat.findFirst({
      where: {
        id: Number(id),
        status: true,
      },
      include: {
        ppns_data_pns: {
          include: {
            ppns_wilayah_kerja: true,
            ppns_upload: true,
            ppns_verifikasi_ppns: true,
            ppns_pengangkatan: true,
            ppns_pelantikan: true,
            ppns_mutasi: true,
            ppns_pengangkatan_kembali: true,
            ppns_perpanjang_ktp: true,
            ppns_penerbitan_ktp: true,
            ppns_pemberhentian_undur_diri: true,
            ppns_pemberhentian_pensiun: true,
            ppns_pemberhentian_nto: true,
          },
        },
      },
    });

    const { ppns_data_pns, ...rest } = result || {};

    const mappingResult = {
      ...rest,
      calon_ppns: ppns_data_pns || [],
    };

    return {
      statusCode: 200,
      message: 'Success',
      data: mappingResult,
    };
  }

  //do verification
  @ApiOperation({ summary: 'Verifikasi Data PPNS' })
  @Post('/verifikasi-data')
  @HttpCode(200)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id_surat: { type: 'number', example: 1 },
        id_data_ppns: { type: 'number', example: 1 },
        verifikasi_data: {
          type: 'string',
          enum: ['sesuai', 'tidak sesuai', 'tolak'],
        },
        keterangan_data: { type: 'string', nullable: true },
        verifikasi_wilayah: {
          type: 'string',
          enum: ['sesuai', 'tidak sesuai', 'tolak'],
        },
        keterangan_wilayah: { type: 'string', nullable: true },
        status_a: { type: 'string', enum: ['sesuai', 'tidak sesuai', 'tolak'] },
        keterangan_a: { type: 'string', nullable: true },
        status_b: { type: 'string', enum: ['sesuai', 'tidak sesuai', 'tolak'] },
        keterangan_b: { type: 'string', nullable: true },
        status_c: { type: 'string', enum: ['sesuai', 'tidak sesuai', 'tolak'] },
        keterangan_c: { type: 'string', nullable: true },
        status_d: { type: 'string', enum: ['sesuai', 'tidak sesuai', 'tolak'] },
        keterangan_d: { type: 'string', nullable: true },
        status_e: { type: 'string', enum: ['sesuai', 'tidak sesuai', 'tolak'] },
        keterangan_e: { type: 'string', nullable: true },
        status_f: { type: 'string', enum: ['sesuai', 'tidak sesuai', 'tolak'] },
        keterangan_f: { type: 'string', nullable: true },
        keterangan_verifikasi: { type: 'string', nullable: true },
        verifikator_by: { type: 'number' },
        status: { type: 'string', enum: ['diterima', 'data baru'] },
      },
    },
  })
  async verifikasiDataPPNS(
    @Body() body: any,
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<any>> {
    const authorization = headers['authorization'] || '';
    AdminValidation.PPNS_VERIFIKASI_DATA.parse(body); // Validasi input body

    const verifEnumMapped: verifikasi_enum | null = body.verifikasi_data
      ? (body.verifikasi_data as verifikasi_enum)
      : null;

    const statusEnumMapped: status_enum | null = body.status
      ? (body.status as status_enum)
      : null;

    //cek data surat
    const suratData = await this.prismaService.ppnsSurat.findUnique({
      where: {
        id: body.id_surat,
      },
    });

    if (!suratData) {
      throw new HttpException(
        `Surat dengan ID ${body.id_surat} tidak ditemukan`,
        404,
      );
    }

    //cek calo ppns
    const calonPpnsData = await this.prismaService.ppnsDataPns.findUnique({
      where: {
        id: body.id_data_ppns,
      },
    });

    if (!calonPpnsData) {
      throw new HttpException(
        `Calon PPNS dengan ID ${body.id_data_ppns} tidak ditemukan`,
        404,
      );
    }

    //jika sudah ada data verifikasi sebelumnya
    const existingVerif = await this.prismaService.ppnsVerifikasiData.findFirst({
      where: {
        id_surat: body.id_surat,
        id_data_ppns: body.id_data_ppns,
      },
    });
    if (existingVerif) {
      throw new HttpException(
        `Data verifikasi untuk surat ID ${body.id_surat} dan calon PPNS ID ${body.id_data_ppns} sudah ada/sudah diverifikasi`,
        400,
      );
    }

    const result = await this.prismaService.ppnsVerifikasiData.create({
      data: {
        id_surat: body.id_surat,
        id_data_ppns: body.id_data_ppns,
        verifikasi_data: verifEnumMapped,
        keterangan_data: body.keterangan_data,
        verifikasi_wilayah: body.verifikasi_wilayah,
        keterangan_wilayah: body.keterangan_wilayah,
        status_a: body.status_a,
        keterangan_a: body.keterangan_a,
        status_b: body.status_b,
        keterangan_b: body.keterangan_b,
        status_c: body.status_c,
        keterangan_c: body.keterangan_c,
        status_d: body.status_d,
        keterangan_d: body.keterangan_d,
        status_e: body.status_e,
        keterangan_e: body.keterangan_e,
        status_f: body.status_f,
        keterangan_f: body.keterangan_f,
        keterangan_verifikasi: body.keterangan_verifikasi,
        verifikator_by: body.verifikator_by,
        verifikator_at: new Date(),
        status: statusEnumMapped,
      },
    });

    return {
      statusCode: 200,
      message: 'Verifikasi berhasil disimpan',
      data: result,
    };
  }

  @Get('/calon-ppns/:id_surat')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get Detail Transasi calon ppns by id surat' })
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
    const totalData = await this.adminRepository.countPpnsDataPnsByIdSurat(
      Number(id_surat),
    );

    // Ambil data berdasarkan pagination
    const item = await this.adminRepository.findPpnsDataPnsByIdSurat(
      Number(id_surat),
      limitNum,
      offset,
    );

    const totalPage = Math.ceil(totalData / limitNum);

    return {
      statusCode: 200,
      message: 'Success',
      data: item,
      pagination: {
        currentPage: pageNum,
        totalPage,
        totalData,
      },
    };
  }
}
