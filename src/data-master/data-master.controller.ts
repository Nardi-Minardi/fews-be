import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { DataMasterService } from './data-master.service';
import { DataMasterRepository } from './data-master.repository';

@ApiTags('Data Master')
@Controller('data-master')
export class DataMasterController {
  constructor(
    private readonly dataMasterService: DataMasterService,
    private readonly dataMasterRepository: DataMasterRepository,
  ) {}

  @Get('wilayah')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'List Wilayah Dinamis',
    description:
      'Ambil daftar wilayah berdasarkan level: provinsi | kab_kota | kecamatan | kel_des. Gunakan parent_code sesuai level.',
  })
  @ApiQuery({
    name: 'level',
    required: true,
    enum: ['provinsi', 'kab_kota', 'kecamatan', 'kel_des'],
    example: 'provinsi',
    description: 'Level wilayah',
  })
  @ApiQuery({ name: 'parent_code', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  async listWilayah(
    @Query('level') level: 'provinsi' | 'kab_kota' | 'kecamatan' | 'kel_des',
    @Query('parent_code') parentCode?: string,
    @Query('search') search?: string,
    @Query('offset') offset = '0',
    @Query('limit') limit = '50',
  ) {
    const pageNum = Math.max(parseInt(offset || '0', 10) || 0, 0) + 1;
    const limitNum = Math.min(
      Math.max(parseInt(limit || '50', 10) || 50, 1),
      200,
    );
    const { data: result, total } = await this.dataMasterRepository.listWilayah({
      level,
      parentCode,
      search,
      page: pageNum,
      limit: limitNum,
    });

    return {
      status_code: 200,
      message: 'success',
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      total_data: total,
      data: result,
    };
  }

  @Get('criteria')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'List Master Criteria',
    description:
      'Ambil data master kriteria',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  async listCriteria(
    @Query('search') search?: string,
    @Query('offset') offset = '0',
    @Query('limit') limit = '50',
  ) {
    const pageNum = Math.max(parseInt(offset || '0', 10) || 0, 0) + 1;
    const limitNum = Math.min(
      Math.max(parseInt(limit || '50', 10) || 50, 1),
      200,
    );
    const { data: result, total } = await this.dataMasterRepository.listCriteria(
      search,
      pageNum,
      limitNum,
    );

    return {
      status_code: 200,
      message: 'success',
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      total_data: total,
      data: result,
    }
  }

  @Get('instansi')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'List Master Instansi',
    description:
      'Ambil data master Instansi',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  async listInstansi(
    @Query('search') search?: string,
    @Query('offset') offset = '0',
    @Query('limit') limit = '50',
  ) {
    const pageNum = Math.max(parseInt(offset || '0', 10) || 0, 0) + 1;
    const limitNum = Math.min(
      Math.max(parseInt(limit || '50', 10) || 50, 1),
      200,
    );
    const { data: result, total } = await this.dataMasterRepository.listInstansi(
      search,
      pageNum,
      limitNum,
    );

    return {
      status_code: 200,
      message: 'success',
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      total_data: total,
      data: result,
    }
  }

  @Get('roles')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'List Master Roles',
    description:
      'Ambil data master Roles',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  async listRoles(
    @Query('search') search?: string,
    @Query('offset') offset = '0',
    @Query('limit') limit = '50',
  ) {
    const pageNum = Math.max(parseInt(offset || '0', 10) || 0, 0) + 1;
    const limitNum = Math.min(
      Math.max(parseInt(limit || '50', 10) || 50, 1),
      200,
    );
    const { data: result, total } = await this.dataMasterRepository.listRoles(
      search,
      pageNum,
      limitNum,
    );

    return {
      status_code: 200,
      message: 'success',
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      total_data: total,
      data: result,
    }
  }

  @Get('jabatan')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'List Master Jabatan',
    description:
      'Ambil data master Jabatan',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  async listJabatan(
    @Query('search') search?: string,
    @Query('offset') offset = '0',
    @Query('limit') limit = '50',
  ) {
    const pageNum = Math.max(parseInt(offset || '0', 10) || 0, 0) + 1;
    const limitNum = Math.min(
      Math.max(parseInt(limit || '50', 10) || 50, 1),
      200,
    );
    const { data: result, total } = await this.dataMasterRepository.listJabatan(
      search,
      pageNum,
      limitNum,
    );

    return {
      status_code: 200,
      message: 'success',
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      total_data: total,
      data: result,
    }
  }
}
