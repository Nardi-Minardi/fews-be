import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { SensorService } from './sensor.service';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';

@Processor('telemetry')
@Injectable()
export class TelemetryProcessor {
  private readonly logger = new Logger(TelemetryProcessor.name);

  constructor(
    private readonly sensorService: SensorService,
    private readonly wsGateway: WebsocketGateway, // ⬅️ inject gateway langsung
  ) {}

  @Process()
  async handle(job: Job<any>) {
    try {
      const payload = job.data;
      const result = await this.sensorService.storeSensor(payload);

      // langsung broadcast ke FE
      this.wsGateway.sendBroadcast('telemetry:update', {
        ...payload, // raw telemetry dari alat
        id: result.id, // tambahkan ID DB kalau perlu
      });

      this.logger.debug(`Processed telemetry job ${job.id}`);
    } catch (e: any) {
      this.logger.error(`Failed job ${job.id}: ${e?.message || e}`);
      throw e;
    }
  }
}
