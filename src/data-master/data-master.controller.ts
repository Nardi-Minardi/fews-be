import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { DataMasterService } from './data-master.service';
import { DataMasterRepository } from './data-master.repository';

@ApiTags('Data Master')
@Controller('data-master')
@ApiBearerAuth()
export class DataMasterController {
  constructor(
    private readonly dataMasterService: DataMasterService,
    private readonly dataMasterRepository: DataMasterRepository,
  ) {}

  @Get('wilayah')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'List wilayah dinamis',
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
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async listWilayah(
    @Query('level') level: 'provinsi' | 'kab_kota' | 'kecamatan' | 'kel_des',
    @Query('parent_code') parentCode?: string,
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const pageNum = Math.max(parseInt(page || '1', 10) || 1, 1);
    const limitNum = Math.min(
      Math.max(parseInt(limit || '50', 10) || 50, 1),
      200,
    );
    return this.dataMasterService.listWilayah({
      level,
      parentCode,
      search,
      page: pageNum,
      limit: limitNum,
    });
  }

  @Get('criteria')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'List Master Kriteria',
    description:
      'Ambil data master kriteria',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async listCriteria(
    @Query('search') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    const pageNum = Math.max(parseInt(page || '1', 10) || 1, 1);
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
      offset: (pageNum - 1) * limitNum,
      total_data: total,
      data: result,
    }
  }
}
