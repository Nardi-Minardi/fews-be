import { Module } from '@nestjs/common';
import { SensorController } from './sensor.controller';
import { SensorService } from './sensor.service';
import { SensorRepository } from './sensor.repository';
import { DasRepository } from 'src/das/das.repository';
import { DeviceRepository } from 'src/device/device.repostiory';
import { BullModule } from '@nestjs/bull';
import { TelemetryProcessor } from './telemetry.processor';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';

@Module({
  imports: [BullModule.registerQueue({ name: 'telemetry' })],
  controllers: [SensorController],
  providers: [
    SensorService,
    SensorRepository,
    DasRepository,
    DeviceRepository,
    TelemetryProcessor,
    WebsocketGateway
  ],
})
export class SensorModule {}
