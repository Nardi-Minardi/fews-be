import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
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
import {
  DAS_DATA,
  getDasByProvinsi,
  DEVICE_DATA,
  topologyData,
} from '../data';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Dashboard')
@Controller('dashboard')
@ApiBearerAuth()
export class DashboardController {
  constructor() {}

  // DAS endpoints
  @Get('das')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Get DAS list',
    description:
      'Mengambil daftar DAS (Daerah Aliran Sungai). Bisa difilter berdasarkan provinsi.',
  })
  @ApiQuery({
    name: 'provinsi_id',
    required: false,
    description: 'ID provinsi untuk filter DAS',
    example: 'jabar',
  })
  getDas(@Query('provinsi_id') provinsiId?: string) {
    const data = provinsiId ? getDasByProvinsi(provinsiId) : DAS_DATA;
    return {
      success: true,
      data: data,
    };
  }

  // Devices endpoints
  @Get('devices')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Get Devices list',
    description:
      'Mengambil daftar device (ARR/AWLR/AWS) beserta status dan sensor terakhir.',
  })
  getDevices() {
    // DEVICE_DATA sudah snake_case, cukup return apa adanya
    return {
      success: true,
      data: DEVICE_DATA,
    };
  }

  // Topology endpoint (TopoJSON)
  @Get('topology')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ApiOperation({
    summary: 'Get Topology (TopoJSON)',
    description:
      'Mengambil data TopoJSON wilayah Jawa Barat. FE dapat mengonversinya menjadi GeoJSON menggunakan topojson-client untuk digunakan di Leaflet.',
  })
  getTopology() {
    return topologyData; // return raw TopoJSON
  }
}
