import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { WebsocketGateway } from './websocket.gateway';
import { WebSocketController } from './websocket.controller';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [CommonModule, BullModule.registerQueue({ name: 'telemetry' })],
  controllers: [WebSocketController],
  providers: [WebsocketGateway],
})
export class WebsocketModule {}
