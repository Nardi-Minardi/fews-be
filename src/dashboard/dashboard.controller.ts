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

@ApiTags('Dashboard')
@Controller('dashboard')
@ApiBearerAuth()
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly prismaService: PrismaService,
  ) {}

  // DAS endpoints
  @Get('das')
  @HttpCode(HttpStatus.OK)
  @Public()
  @RedisCache('fews-be-dashboard-das-list', 5)
  @ApiOperation({
    summary: 'Get DAS List',
    description:
      'Mengambil daftar DAS (Daerah Aliran Sungai). Bisa difilter berdasarkan provinsi.',
  })
  @ApiQuery({
    name: 'provinsi_code',
    required: false,
    description: 'Kode provinsi (2 digit, tanpa titik)',
    example: '32',
  })
  @ApiQuery({
    name: 'kab_kota_code',
    required: false,
    description: 'Kode kabupaten/kota (4 digit, tanpa titik)',
    example: '3204',
  })
  @ApiQuery({
    name: 'kecamatan_code',
    required: false,
    description: 'Kode kecamatan (6 digit, tanpa titik)',
    example: '320437',
  })
  @ApiQuery({
    name: 'kel_des_code',
    required: false,
    description: 'Kode kelurahan/desa (10 digit, tanpa titik)',
    example: '3204372002',
  })
  async getDas(
    @Query('provinsi_code') provinsi_code?: string,
    @Query('kab_kota_code') kab_kota_code?: string,
    @Query('kecamatan_code') kecamatan_code?: string,
    @Query('kel_des_code') kel_des_code?: string,
  ) {
    const data = await this.dashboardService.getDas({
      provinsi_code,
      kab_kota_code,
      kecamatan_code,
      kel_des_code,
    });
    return { status_code: HttpStatus.OK, message: 'Success', data };
  }

  // Device tags endpoints
  @Get('devices/tags')
  @HttpCode(HttpStatus.OK)
  @Public()
  @RedisCache('fews-be-dashboard-devices-tags-list', 5)
  @ApiOperation({
    summary: 'Get Device Tags List',
    description: 'Mengambil daftar tag device (ARR/AWLR/AWS) yang tersedia.',
  })
  async getDevicesTags() {
    const data = await this.prismaService.m_device_tag.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
    return { status_code: HttpStatus.OK, message: 'Success', data };
  }

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
  ) {
    const parsedLimit = Number(limit);
    const parsedOffset = Number(offset);
    const parsedInstansiId = instansi_id ? Number(instansi_id) : null;
    if (search === '""' || search === "''") search = '';
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

    const result = await this.dashboardService.getDevices(
      parsedLimit,
      parsedOffset,
      search,
      provinsi_code,
      kab_kota_code,
      kecamatan_code,
      kel_des_code,
      parsedDeviceTagIds,
      parsedInstansiId,
    );
    return {
      status_code: HttpStatus.OK,
      message: 'Success',
      ...result,
    };
  }

  // Device sensors endpoints
  @Get(':device_uid/sensors')
  @Public()
  @ApiOperation({
    summary: 'Get Sensor Log by Device UID',
    description:
      'Mengambil daftar sensor dari sebuah device beserta kriteria penilaian (misal level bahaya untuk sensor curah hujan).',
  })
  @ApiParam({
    name: 'device_uid',
    required: true,
    description: 'Unique ID dari device',
    example: '4f2eb2e5-9f14-413b-97d4-07b689847e97',
  })
  @HttpCode(HttpStatus.OK)
  async getDeviceSensors(
    @Param('device_uid') device_uid: string,
  ): Promise<WebResponse<any>> {
    const { sensors, criteria, total_data } =
      await this.dashboardService.getDeviceSensorsWithCriteria(device_uid);
    return {
      status_code: 200,
      message: 'success',
      offset: 0,
      total_data,
      data: criteria,
      sensors,
    } as any;
  }
}
