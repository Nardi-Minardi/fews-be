import {
  Controller,
  Get,
  Query,
  HttpStatus,
  HttpCode,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { DashboardService } from './dashboard.service';
import { PrismaService } from 'src/common/prisma.service';
import { RedisCache } from 'src/common/decorators/redis-cache.decorator';
import { WebResponse } from 'src/common/web.response';

@ApiTags('Dashboard Table')
@Controller('dashboard-table')
@ApiBearerAuth()
export class DashboardTableController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly prismaService: PrismaService,
  ) {}

  // Devices endpoints
  @Get('devices')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Get Devices List',
    description:
      'Mengambil daftar device (ARR/AWLR/AWS) beserta status dan sensor terakhir, dengan pagination.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'tanjung',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  async getDevices(
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
    @Query('search') search?: string,
    @Query('provinsi_code') provinsi_code?: string,
    @Query('kab_kota_code') kab_kota_code?: string,
    @Query('kecamatan_code') kecamatan_code?: string,
    @Query('kel_des_code') kel_des_code?: string,
    @Query('device_tag_id') device_tag_id?: any,
    @Query('instansi_id') instansi_id?: string,
    @Query('hidrologi_type') hidrologi_type?: string,
  ) {
    const parsedLimit = Number(limit);
    const parsedOffset = Number(offset);
    const parsedInstansiId = instansi_id ? Number(instansi_id) : null;
    if (search === '""' || search === "''") search = '';
    if (hidrologi_type === '""' || hidrologi_type === "''") hidrologi_type = '';
    let parsedDeviceTagIds: number[] = [];
    if (device_tag_id) {
      try {
        if (typeof device_tag_id === 'string') {
          // Bisa bentuk [1,2] atau "1,2"
          parsedDeviceTagIds = JSON.parse(device_tag_id);
        } else if (Array.isArray(device_tag_id)) {
          parsedDeviceTagIds = device_tag_id.map(Number);
        }
      } catch {
        // fallback misal query seperti ?device_tag_id=1,2
        parsedDeviceTagIds = device_tag_id
          .split(',')
          .map((v: string) => parseInt(v))
          .filter(Boolean);
      }
    }

    const result = await this.dashboardService.getDevicesTable(
      parsedLimit,
      parsedOffset,
      search,
      provinsi_code,
      kab_kota_code,
      kecamatan_code,
      kel_des_code,
      parsedDeviceTagIds,
      parsedInstansiId,
      hidrologi_type,
    );
    return {
      status_code: HttpStatus.OK,
      message: 'Success',
      ...result,
    };
  }

  // Hidrologi Type endpoints
  @Get('devices/hidrologi-types')
  @HttpCode(HttpStatus.OK)
  @Public()
  @RedisCache('fews-be-dashboard-devices-hidrologi-types-list', 5)
  @ApiOperation({
    summary: 'Get Hidrologi Types List',
    description:
      'Mengambil daftar tipe hidrologi dari device (ARR/AWLR/AWS) yang tersedia.',
  })
  async getDevicesHidrologiTypes() {
    const data = await this.prismaService.m_device.findMany({
      distinct: ['hidrologi_type'],
      select: {
        hidrologi_type: true,
      },
      orderBy: {
        hidrologi_type: 'asc',
      },
    });

    return {
      status_code: HttpStatus.OK,
      message: 'Success',
      data,
    };
  }
}
