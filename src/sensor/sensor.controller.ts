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
    summary: 'Terima Data Queue Real-Time Telemetry (socket)',
    description:
      'Endpoint ini digunakan untuk menerima data telemetry dari perangkat (telemetri). Akan melakukan **upsert** untuk `m_device` dan `tr_sensor`.',
  })
  @ApiBody({
    description: 'Payload telemetry yang dikirim oleh perangkat',
    required: true,
    schema: {
      type: 'object',
      properties: {
        device_id: { type: 'string', example: '4f2eb2e5-9f14-413b-97d4-07b689847e97' },
        sensors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sensor_id: { type: 'string', example: 'fe163b92-83c2-4d01-9bba-c9d7c99e5b64' },
              name: { type: 'string', example: 'Rainfall Level' },
              unit: { type: 'string', example: 'mm' },
              sensor_type: { type: 'string', example: 'TELEMETRI' },
            },
          },
          example: [
            {
              sensor_id: 'fe163b92-83c2-4d01-9bba-c9d7c99e5b64',
              name: 'Rainfall Level',
              unit: 'mm',
              sensor_type: 'TELEMETRI',
              value: 0,
            },
          ],
        },
      },
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
}
