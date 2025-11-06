import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/common/redis.service';

@WebSocketGateway({
  cors: {
    origin: '*', // gunakan origin FE kamu kalau ingin aman: ['http://localhost:5173']
    credentials: true,
  },
  namespace: '/ws',
})
@Injectable()
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly redisService: RedisService) {}

  /**
   * Dijalankan saat Gateway pertama kali inisialisasi.
   * Di sini kita subscribe ke channel Redis supaya semua pesan telemetry
   * bisa diteruskan ke client FE via websocket.
   */
  async afterInit() {
    const channel =
      process.env.REDIS_PUBSUB_CHANNEL_TELEMETRY || 'telemetry:update';

    this.logger.log(`[WS] Initializing WebSocket Gateway...`);
    this.logger.log(`[WS] Subscribing to Redis channel: ${channel}`);

    await this.redisService.subscribe(channel, (message) => {
      this.logger.debug(`[WS] Received message from Redis: ${message}`);

      try {
        const parsed = JSON.parse(message);
        const data =
          parsed && parsed.type === 'telemetry' && parsed.payload
            ? parsed.payload
            : parsed;

        this.server.emit('telemetry:update', data);
        this.logger.debug(
          `[WS] Broadcasted telemetry:update to clients (${this.server.engine.clientsCount} connected)`,
        );
      } catch (e) {
        this.logger.error(`[WS] Error parsing Redis message: ${e.message}`);
        this.server.emit('telemetry:update', { raw: message });
      }
    });

    this.logger.log(`[WS] WebSocket Gateway initialized and ready`);
  }

  /**
   * Saat client FE tersambung
   */
  handleConnection(client: any) {
    this.logger.log(`[WS] Client connected: ${client.id}`);
    client.emit('connection:ack', { message: 'Connected to FEWS WebSocket' });
  }

  /**
   * Saat client FE disconnect
   */
  handleDisconnect(client: any) {
    this.logger.log(`[WS] Client disconnected: ${client.id}`);
  }

  /**
   * Kirim pesan manual ke semua klien (opsional untuk debugging)
   */
  sendBroadcast(event: string, payload: any) {
    this.server.emit(event, payload);
    this.logger.debug(`[WS] Manual broadcast: ${event}`);
  }
}
