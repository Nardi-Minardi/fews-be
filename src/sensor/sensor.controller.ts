import {
  Controller,
  HttpStatus,
  HttpCode,
  Post,
  Body,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
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
import { RedisCache } from 'src/common/decorators/redis-cache.decorator';
import { WebResponse } from 'src/common/web.response';
import { SensorService } from './sensor.service';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';

@ApiTags('Sensor')
@Controller('sensor')
@ApiBearerAuth()
export class SensorController {
  constructor(
    private readonly sensorService: SensorService,
    private readonly webSocketGateway: WebsocketGateway,
    @InjectQueue('telemetry') private readonly telemetryQueue: Queue,
  ) {}

  @Post('telemetry')
  @Public()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Terima data telemetry dari perangkat',
    description:
      'Endpoint ini digunakan untuk menerima data telemetry dari perangkat (telemetri). Akan melakukan **upsert** untuk `m_device` dan `tr_sensor`.',
  })
  @ApiBody({
    description: 'Payload telemetry yang dikirim oleh perangkat',
    required: true,
    schema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', example: 'DEVICE-001' },
        name: { type: 'string', example: 'Rahtawu - Level Water' },
        device_status: { type: 'string', example: 'Online' },
        timestamp: { type: 'string', example: '2025-11-05T12:00:00Z' },
        last_battery: { type: 'number', example: 85.5 },
        last_signal: { type: 'number', example: 107.624315 },
        lat: { type: 'number', example: -6.708532 },
        long: { type: 'number', example: 108.196444 },
        value: { type: 'number', example: 120.5 },
        cctv_url: {
          type: 'string',
          example: 'https://stream.fews-cs7.id/cctv/device-001',
        },
        sensors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sensor_id: { type: 'string', example: 'S1' },
              name: { type: 'string', example: 'Tinggi Muka Air' },
              unit: { type: 'string', example: 'cm' },
              sensor_type: { type: 'string', example: 'water_level' },
            },
          },
          example: [
            {
              sensor_id: 'S1-A21xwz',
              name: 'Tinggi Muka Air',
              unit: 'cm',
              sensor_type: 'water_level',
              value: 145.6,
            },
            {
              sensor_id: 'S2-B34ytz',
              name: 'Curah Hujan',
              unit: 'mm',
              sensor_type: 'rainfall',
              value: 12.3,
            },
          ],
        },
      },
      required: [
        'device_id',
        'name',
        'device_type',
        'device_status',
        'timestamp',
        'last_battery',
        'last_signal',
        'lat',
        'long',
        'value',
        'sensors',
      ],
    },
  })
  async receiveTelemetry(@Body() request): Promise<WebResponse<any>> {
    const job = await this.telemetryQueue.add(request, {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });

    return {
      status_code: 202,
      message: 'Data diterima (202 Accepted)',
      data: { job_id: job.id },
    };
  }

  // @Post('telemetry')
  // @Public()
  // @HttpCode(HttpStatus.ACCEPTED)
  // async telemetryAlias(@Body() request): Promise<WebResponse<any>> {
  //   return this.receiveTelemetry(request);
  // }

  @Post('test-message')
  @Public()
  @ApiOperation({
    summary: 'Kirim pesan test ke WebSocket',
    description:
      'Endpoint ini digunakan untuk mengirim pesan test ke WebSocket Gateway. Berguna untuk pengujian konektivitas dan penerimaan pesan di sisi client.',
  })
  @HttpCode(HttpStatus.OK)
  sendTestMessage() {
    // const payload = {
    //   id: 999,
    //   device_name: 'Test Device',
    //   value: Math.floor(Math.random() * 100),
    //   device_status: 'OK',
    //   last_sending_data: new Date().toISOString(),
    // };
    const payload = {
      device_uid: 'DEVICE-001',
      name: 'Test Device',
      device_type: 'AWLR',
      device_status: 'Online',
      timestamp: new Date().toISOString(),
      last_battery: 75.5,
      last_signal: -85.3,
      lat: -6.708532,
      long: 108.196444,
      value: Math.floor(Math.random() * 100),
      cctv_url: 'https://stream.fews-cs7.id/cctv/device-001',
      sensors: [
        {
          sensor_id: 'S1-A21xwz',
          name: 'Tinggi Muka Air',
          unit: 'cm',
          sensor_type: 'water_level',
          value: parseFloat((Math.random() * 200).toFixed(2)),
        },
        {
          sensor_id: 'S2-B34ytz',
          name: 'Curah Hujan',
          unit: 'mm',
          sensor_type: 'rainfall',
          value: parseFloat((Math.random() * 50).toFixed(2)),
        },
      ],
    };

    console.log('Sending test payload to websocket:', payload);

    this.webSocketGateway.server.emit('telemetry:update', payload);

    return { success: true, message: 'Test message sent', payload };
  }
}
