import {
  Controller,
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
import { ListInstansiDto } from './dto/data-master.dto';

@Controller('/data-master')
export class DataMasterController {
  constructor(
    private dataMasterService: DataMasterService,
    private dataMasterRepository: DataMasterRepository,
    private validationService: ValidationService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger, // perbaikan
  ) {}

  @Get('/notaris-pengganti/search')
  @HttpCode(200)
  async getNotarisPengganti(
    @Query('nama') nama: string,
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

  @Get('/notaris-pengganti/:idNotarisPengganti')
  @HttpCode(200)
  async getNotarisPenggantiDetail(
    @Param('idNotarisPengganti') idNotarisPengganti: string,
  ): Promise<WebResponse<NotarisPenggantiDto>> {
    const result = await this.dataMasterRepository.findNotarisPenggantiById(
      Number(idNotarisPengganti),
    );

    if (!result) {
      throw new NotFoundException(
        `Notaris Pengganti with id ${idNotarisPengganti} not found`,
      );
    }

    const formattedResult: NotarisPenggantiDto = {
      id: result.id,
      nama: result.nama,
      provinsi: result.provinsi,
      idProvinsi: result.id_provinsi,
    };

    return {
      statusCode: 200,
      message: 'Success',
      data: formattedResult,
    };
  }

  @Get('/kbli/:idKbli')
  @HttpCode(200)
  async detailKbli(
    @Param('idKbli') idKbli: string,
  ): Promise<WebResponse<KbliDto>> {
    const rawResult = await this.dataMasterRepository.findKbliById(
      Number(idKbli),
    );

    if (!rawResult) {
      throw new NotFoundException(`KBLI with id ${idKbli} not found`);
    }

    const result: KbliDto = {
      idKbli: rawResult.id_kbli,
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
  // @RedisCache('badan-usaha-admin-transaksi-list', 60)
  async getAllLayanan(
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('orderBy') orderBy: string,
    @Query('filters') filters: string,
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
  // @RedisCache('badan-usaha-admin-transaksi-list', 60)
  async getAllKementerian(
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('orderBy') orderBy: string,
    @Query('filters') filters: string,
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
  // @RedisCache('badan-usaha-admin-transaksi-list', 60)
  async getAllPangkatGolongan(
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('orderBy') orderBy: string,
    @Query('filters') filters: string,
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

    result = await this.dataMasterRepository.findAllWithPaginationPangkatGolongan(
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
  // @RedisCache('badan-usaha-admin-transaksi-list', 60)
  async getAllDataPpns(
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('orderBy') orderBy: string,
    @Query('filters') filters: string,
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
  // @RedisCache('badan-usaha-admin-transaksi-list', 60)
  async getAllInstansi(
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('orderBy') orderBy: string,
    @Query('filters') filters: string,
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

  @Get('/instansi/:idKementerian')
  @HttpCode(200)
  async detailInstansiByIdKementerian(
    @Param('idKementerian') idKementerian: string,
  ): Promise<WebResponse<ListInstansiDto[]>> {
    const rawResults =
      await this.dataMasterRepository.findInstansiByIdKementerian(
        Number(idKementerian),
      );

    if (!rawResults || rawResults.length === 0) {
      throw new NotFoundException(
        `Instansi with id_kementerian ${idKementerian} not found`,
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
}
