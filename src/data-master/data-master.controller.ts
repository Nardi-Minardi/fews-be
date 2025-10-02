import {
  BadRequestException,
  Controller,
  Headers,
  Inject,
  NotFoundException,
  Param,
  Req,
} from '@nestjs/common';
import { Get, Query, HttpCode } from '@nestjs/common';
import { Pagination, WebResponse } from 'src/common/web.response';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  NotarisPenggantiDto,
  ResponseNotarisPenggantiDto,
} from './dto/notaris-pengganti.dto';
import { DataMasterService } from './data-master.service';
import { DataMasterRepository } from './data-master.repository';
import { KbliDto } from './dto/kbli.dto';
import { DataMasterValidation } from './data-master.validation';
import { ValidationService } from 'src/common/validation.service';
import { Request } from 'express';
import {
  ListInstansiDto,
  ResponseListCalonPemohonDto,
} from './dto/data-master.dto';
import { SuratRepository } from 'src/surat/surat.repository';
import { getUserFromToken } from 'src/common/utils/helper.util';
import { MasterPrismaService, PrismaService } from 'src/common/prisma.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Data Master')
@Controller('/data-master')
export class DataMasterController {
  constructor(
    private dataMasterService: DataMasterService,
    private dataMasterRepository: DataMasterRepository,
    private suratRepository: SuratRepository,
    private masterPrismaService: MasterPrismaService,
    private prismaService: PrismaService,
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger, // perbaikan
  ) {}

  @Get('/notaris-pengganti/search')
  @HttpCode(200)
  @ApiOperation({ summary: 'Search Notaris Pengganti by name' })
  async getNotarisPengganti(
    @Query('nama') nama: string | null,
  ): Promise<WebResponse<ResponseNotarisPenggantiDto>> {
    const result = await this.dataMasterService.searchNotarisPengganti({
      nama: nama?.trim() || '',
    });
    return {
      statusCode: 200,
      message: 'Success',
      data: result,
    };
  }

  @Get('/notaris-pengganti/:id_notaris_pengganti')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get Notaris Pengganti detail by id' })
  async getNotarisPenggantiDetail(
    @Param('id_notaris_pengganti') id_notaris_pengganti: string,
  ): Promise<WebResponse<NotarisPenggantiDto>> {
    const result = await this.dataMasterRepository.findNotarisPenggantiById(
      Number(id_notaris_pengganti),
    );

    if (!result) {
      throw new NotFoundException(
        `Notaris Pengganti with id ${id_notaris_pengganti} not found`,
      );
    }

    const formattedResult: NotarisPenggantiDto = {
      id: result.id,
      nama: result.nama,
      provinsi: result.provinsi,
      id_provinsi: result.id_provinsi,
    };

    return {
      statusCode: 200,
      message: 'Success',
      data: formattedResult,
    };
  }

  @Get('/kbli/:id_kbli')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get KBLI detail by id' })
  async detailKbli(
    @Param('id_kbli') id_kbli: string,
  ): Promise<WebResponse<KbliDto>> {
    const rawResult = await this.dataMasterRepository.findKbliById(
      Number(id_kbli),
    );

    if (!rawResult) {
      throw new NotFoundException(`KBLI with id ${id_kbli} not found`);
    }

    const result: KbliDto = {
      id_kbli: rawResult.id_kbli,
      kode: rawResult.kode,
      kategori: rawResult.kategori,
      judul: rawResult.judul,
      uraian: rawResult.uraian,
      tahun: rawResult.tahun,
      status: rawResult.status,
    };

    return {
      statusCode: 200,
      message: 'Success',
      data: result,
    };
  }

  @Get('/layanan')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get all Layanan' })
  // @RedisCache('badan-usaha-admin-transaksi-list', 60)
  async getAllLayanan(
    @Query('search') search: string | null,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('orderBy') orderBy: string | null,
    @Query('filters') filters: string | null,
    @Req() request: Request,
  ): Promise<WebResponse<any[], Pagination>> {
    let result;
    let count;

    let parsedFilters: Record<string, any> = {};
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters); // langsung jadi object
      } catch (e) {
        console.warn('Invalid filters JSON:', filters);
      }
    }

    const queryWithParsedFilters = {
      ...request.query,
      filters: parsedFilters, // override jadi object
    };

    const getRequest = this.validationService.validate(
      DataMasterValidation.GET_DATA_MASTER,
      queryWithParsedFilters,
    );

    result = await this.dataMasterRepository.findAllWithPaginationLayanan(
      getRequest.search,
      getRequest.page,
      getRequest.limit,
      getRequest.orderBy,
      getRequest.orderDirection,
      getRequest.filters,
    );
    count = await this.dataMasterRepository.countSearchLayanan(
      getRequest.search,
    );

    this.logger.debug('Layanan result', {
      result,
      count,
    });

    return {
      statusCode: 200,
      message: 'Success',
      data: result,
      pagination: {
        currentPage: Number(page) || 1,
        totalPage: Math.ceil(count / (Number(limit) || 10)),
        totalData: count,
      },
    };
  }

  @Get('/kementerian')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get all Kementerian' })
  // @RedisCache('badan-usaha-admin-transaksi-list', 60)
  async getAllKementerian(
    @Query('search') search: string | null,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('orderBy') orderBy: string | null,
    @Query('filters') filters: string | null,
    @Req() request: Request,
  ): Promise<WebResponse<any[], Pagination>> {
    let result;
    let count;

    let parsedFilters: Record<string, any> = {};
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters); // langsung jadi object
      } catch (e) {
        console.warn('Invalid filters JSON:', filters);
      }
    }

    const queryWithParsedFilters = {
      ...request.query,
      filters: parsedFilters, // override jadi object
    };

    const getRequest = this.validationService.validate(
      DataMasterValidation.GET_DATA_MASTER_WITHOUT_PAGINATION,
      queryWithParsedFilters,
    );

    result = await this.dataMasterRepository.findAllWithPaginationKementerian(
      getRequest.search,
      getRequest.page,
      getRequest.limit,
      getRequest.orderBy,
      getRequest.orderDirection,
      getRequest.filters,
    );
    count = await this.dataMasterRepository.countSearchKementerian(
      getRequest.search,
    );

    this.logger.debug('Kementerian result', {
      result,
      count,
    });

    return {
      statusCode: 200,
      message: 'Success',
      data: result,
      pagination: {
        currentPage: Number(page) || 1,
        totalPage: Math.ceil(count / (Number(limit) || 10)),
        totalData: count,
      },
    };
  }

  @Get('/pangkat-golongan')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get all Pangkat Golongan' })
  // @RedisCache('badan-usaha-admin-transaksi-list', 60)
  async getAllPangkatGolongan(
    @Query('search') search: string | null,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('orderBy') orderBy: string | null,
    @Query('filters') filters: string | null,
    @Req() request: Request,
  ): Promise<WebResponse<any[], Pagination>> {
    let result;
    let count;

    let parsedFilters: Record<string, any> = {};
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters); // langsung jadi object
      } catch (e) {
        console.warn('Invalid filters JSON:', filters);
      }
    }

    const queryWithParsedFilters = {
      ...request.query,
      filters: parsedFilters, // override jadi object
    };

    const getRequest = this.validationService.validate(
      DataMasterValidation.GET_DATA_MASTER_WITHOUT_PAGINATION,
      queryWithParsedFilters,
    );

    result =
      await this.dataMasterRepository.findAllWithPaginationPangkatGolongan(
        getRequest.search,
        getRequest.page,
        getRequest.limit,
        getRequest.orderBy,
        getRequest.orderDirection,
        getRequest.filters,
      );
    count = await this.dataMasterRepository.countSearchPangkatGolongan(
      getRequest.search,
    );

    this.logger.debug('Pangkat Golongan result', {
      result,
      count,
    });

    return {
      statusCode: 200,
      message: 'Success',
      data: result,
      pagination: {
        currentPage: Number(page) || 1,
        totalPage: Math.ceil(count / (Number(limit) || 10)),
        totalData: count,
      },
    };
  }

  @Get('/data-ppns')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get all Data PPNS' })
  // @RedisCache('badan-usaha-admin-transaksi-list', 60)
  async getAllDataPpns(
    @Query('search') search: string | null,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('orderBy') orderBy: string | null,
    @Query('filters') filters: string | null,
    @Req() request: Request,
  ): Promise<WebResponse<any[], Pagination>> {
    let result;
    let count;

    let parsedFilters: Record<string, any> = {};
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters); // langsung jadi object
      } catch (e) {
        console.warn('Invalid filters JSON:', filters);
      }
    }

    const queryWithParsedFilters = {
      ...request.query,
      filters: parsedFilters, // override jadi object
    };

    const getRequest = this.validationService.validate(
      DataMasterValidation.GET_DATA_MASTER_WITHOUT_PAGINATION,
      queryWithParsedFilters,
    );

    result = await this.dataMasterRepository.findAllWithPaginationDataPpns(
      getRequest.search,
      getRequest.page,
      getRequest.limit,
      getRequest.orderBy,
      getRequest.orderDirection,
      getRequest.filters,
    );
    count = await this.dataMasterRepository.countSearchDataPpns(
      getRequest.search,
    );

    this.logger.debug('Data PPNS  result', {
      result,
      count,
    });

    return {
      statusCode: 200,
      message: 'Success',
      data: result,
      pagination: {
        currentPage: Number(page) || 1,
        totalPage: Math.ceil(count / (Number(limit) || 10)),
        totalData: count,
      },
    };
  }

  @Get('/instansi')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get all Instansi' })
  // @RedisCache('badan-usaha-admin-transaksi-list', 60)
  async getAllInstansi(
    @Query('search') search: string | null,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('orderBy') orderBy: string | null,
    @Query('filters') filters: string | null,
    @Req() request: Request,
  ): Promise<WebResponse<any[], Pagination>> {
    let result;
    let count;

    let parsedFilters: Record<string, any> = {};
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters); // langsung jadi object
      } catch (e) {
        console.warn('Invalid filters JSON:', filters);
      }
    }

    const queryWithParsedFilters = {
      ...request.query,
      filters: parsedFilters, // override jadi object
    };

    const getRequest = this.validationService.validate(
      DataMasterValidation.GET_DATA_MASTER_WITHOUT_PAGINATION,
      queryWithParsedFilters,
    );

    result = await this.dataMasterRepository.findAllWithPaginationInstansi(
      getRequest.search,
      getRequest.page,
      getRequest.limit,
      getRequest.orderBy,
      getRequest.orderDirection,
      getRequest.filters,
    );
    count = await this.dataMasterRepository.countSearchInstansi(
      getRequest.search,
    );

    this.logger.debug('Instansi result', {
      result,
      count,
    });

    return {
      statusCode: 200,
      message: 'Success',
      data: result,
      pagination: {
        currentPage: Number(page) || 1,
        totalPage: Math.ceil(count / (Number(limit) || 10)),
        totalData: count,
      },
    };
  }

  @Get('/instansi/:id_kementerian')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get Instansi by id_kementerian' })
  async detailInstansiByIdKementerian(
    @Param('id_kementerian') id_kementerian: string,
  ): Promise<WebResponse<ListInstansiDto[]>> {
   
    const rawResults =
      await this.dataMasterRepository.findInstansiByIdKementerian(
        Number(id_kementerian),
      );

    if (!rawResults || rawResults.length === 0) {
      throw new NotFoundException(
        `Instansi with id_kementerian ${id_kementerian} not found`,
      );
    }

    const results: ListInstansiDto[] = rawResults.map((item) => ({
      id: item.id,
      nama: item.nama,
      id_kementerian: item.id_kementerian,
      ppns_kementerian: item.ppns_kementerian,
      created_at: item.created_at ? item.created_at.toISOString() : null,
    }));

    return {
      statusCode: 200,
      message: 'Success',
      data: results,
    };
  }

  @Get('/calon-ppns/:layanan/:nip')
  @ApiOperation({ summary: 'Get Data PPNS search by NIP' })
  @HttpCode(200)
  async getByCalonPPns(
    @Param('nip') nip: string,
    @Param('layanan') layanan: string,
    @Headers() headers: Record<string, any>,
  ): Promise<{ statusCode: number; message: string; data: Object }> {
    const authorization = headers['authorization'] || '';

    const userLogin = await getUserFromToken(authorization);
    if (!userLogin) {
      throw new BadRequestException('Authorization is missing');
    }

    const validRequest = this.validationService.validate(
      DataMasterValidation.GET_DATA_PPNS_BY_NIP,
      { nip, layanan },
    );

    const result = await this.prismaService.ppnsDataPns.findFirst({
      where: { nip: validRequest.nip },
      include: {
        ppns_wilayah_kerja: true,
        ppns_surat: true,
      },
    });

    if (!result) {
      throw new NotFoundException(` Data PPNS with NIP ${nip} not found`);
    }

    const wilayahKerja = result.ppns_wilayah_kerja.map((w) => ({
      penempatan_baru: w.penempatan_baru,
      uu_dikawal: [w.uu_dikawal_1, w.uu_dikawal_2, w.uu_dikawal_3].filter(
        (u): u is string => !!u,
      ),
    }));

    let lokasi_penempatan: any = null;

    const dataAgama = await this.masterPrismaService.agama.findFirst({
      where: { id_agama: result.agama || undefined },
    });
    const dataPangkatGolongan =
      await this.prismaService.ppnsPangkatGolongan.findFirst({
        where: {
          id: result.pangkat_golongan
            ? Number(result.pangkat_golongan)
            : undefined,
        },
      });

    switch (validRequest.layanan) {
      case 'verifikasi':
        lokasi_penempatan = this.prismaService.ppnsVerifikasiPpns.findFirst({
          where: { id_data_ppns: result.id },
          select: {
            provinsi_penempatan: true,
            kabupaten_penempatan: true,
            unit_kerja: true,
          },
        });
        break;
      case 'pengangkatan':
        lokasi_penempatan = this.prismaService.ppnsPengangkatan.findFirst({
          where: { id_data_ppns: result.id },
          select: {
            provinsi_penempatan: true,
            kabupaten_penempatan: true,
            unit_kerja: true,
          },
        });
        break;
      case 'pelantikan':
        lokasi_penempatan = this.prismaService.ppnsPelantikan.findFirst({
          where: { id_data_ppns: result.id },
          select: {
            provinsi_penempatan: true,
            kabupaten_penempatan: true,
            unit_kerja: true,
          },
        });
        break;
      case 'mutasi':
        lokasi_penempatan = this.prismaService.ppnsMutasi.findFirst({
          where: { id_data_ppns: result.id },
          select: {
            provinsi_penempatan: true,
            kabupaten_penempatan: true,
            unit_kerja: true,
          },
        });
        break;
      case 'pengangkatan kembali':
        lokasi_penempatan =
          this.prismaService.ppnsPengangkatanKembali.findFirst({
            where: { id_data_ppns: result.id },
            select: {
              provinsi_penempatan: true,
              kabupaten_penempatan: true,
              unit_kerja: true,
            },
          });
        break;
      case 'perpanjang ktp':
        lokasi_penempatan = this.prismaService.ppnsPerpanjangKtp.findFirst({
          where: { id_data_ppns: result.id },
          select: {
            provinsi_penempatan: true,
            kabupaten_penempatan: true,
            unit_kerja: true,
          },
        });
        break;
      case 'pemberhentian':
      case 'pemberhentian NTO':
      case 'undur diri':
      case 'pensiun':
    }

    //gelar depan dan gelar belakang ambil dari nama gelar. dia dipisah pake ; misal Drs.;H
    const namaGelarParts = result.nama_gelar
      ? result.nama_gelar.split(';').map((part) => part.trim())
      : [];
    const gelarDepan = namaGelarParts.length > 0 ? namaGelarParts[0] : '';
    const gelarBelakang = namaGelarParts.length > 1 ? namaGelarParts[1] : '';
    const jenisKemalinEnumMap: Record<string, string> = {
      pria: 'Pria',
      wanita: 'Wanita',
    };

    return {
      statusCode: 200,
      message: 'Success',
      data: {
        identitas_pns: {
          id: result.id,
          nama: result.nama,
          nip: result.nip,
          nama_gelar: result.nama_gelar,
          jabatan: result.jabatan,
          pangkat_golongan: result.pangkat_golongan,
          data_pangkat_golongan: dataPangkatGolongan || null,
          data_agama: dataAgama,
          gelar_depan: gelarDepan,
          gelar_belakang: gelarBelakang,
          jenis_kelamin: result.jenis_kelamin
            ? jenisKemalinEnumMap[result.jenis_kelamin]
            : '',
          agama: result.agama,
          nama_sekolah: result.nama_sekolah,
          gelar_terakhir: result.gelar_terakhir,
          no_ijazah: result.no_ijazah,
          tgl_ijazah: result.tgl_ijazah
            ? result.tgl_ijazah.toISOString()
            : null,
          tahun_lulus: result.tahun_lulus,
        },
        // wilayah_kerja: wilayahKerja,
        lokasi_penempatan: await lokasi_penempatan,
      },
    };
  }
}
