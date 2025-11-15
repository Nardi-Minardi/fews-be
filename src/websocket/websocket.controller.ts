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
import { WebsocketGateway } from 'src/websocket/websocket.gateway';

@ApiTags('WebSocket')
@Controller('web-socket')
@ApiBearerAuth()
export class WebSocketController {
  constructor(
    private readonly webSocketGateway: WebsocketGateway,
    @InjectQueue('telemetry') private readonly telemetryQueue: Queue,
  ) {}

  @Post('test-message')
  @Public()
  @ApiOperation({
    summary: 'Test Mesage ke WebSocket',
    description:
      'Endpoint ini digunakan untuk mengirim pesan test ke WebSocket Gateway. Berguna untuk pengujian konektivitas dan penerimaan pesan di sisi client.',
  })
  @HttpCode(HttpStatus.OK)
  sendTestMessage() {
    const payload = {
      device_id: '4f2eb2e5-9f14-413b-97d4-07b689847e97',
      sensors: [
        {
          sensor_id: 'fe163b92-83c2-4d01-9bba-c9d7c99e5b64',
          name: 'Rainfall Level',
          unit: 'mm',
          sensor_type: 'TELEMETRI',
          value: 0,
        },
      ],
    };

    console.log('Sending test payload to websocket:', payload);

    this.webSocketGateway.server.emit('telemetry:update', payload);

    return { success: true, message: 'Test message sent', payload };
  }
}
