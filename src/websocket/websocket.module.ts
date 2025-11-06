import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { WebsocketGateway } from './websocket.gateway';

@Module({
  imports: [CommonModule],
  providers: [WebsocketGateway],
})
export class WebsocketModule {}
