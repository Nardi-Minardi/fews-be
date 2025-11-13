import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { SensorService } from './sensor.service';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';

@Processor('telemetry')
@Injectable()
@Processor('telemetry')
@Injectable()
export class TelemetryProcessor {
  private readonly logger = new Logger(TelemetryProcessor.name);

  constructor(
    private readonly sensorService: SensorService,
    private readonly wsGateway: WebsocketGateway,
  ) {}

  @Process()
  async handle(job: Job<any>) {
    try {
      this.logger.debug(`Processing job ${job.id} with data`, job.data);
      const payload = job.data;
      const result = await this.sensorService.storeSensor(payload);

      // kirim notifikasi ke FE
      this.wsGateway.sendBroadcast('telemetry:update', {
        ...payload,
        device_uid: result.device_uid,
      });

      this.logger.debug(`✅ Job ${job.id} processed successfully`);
    } catch (e: any) {
      this.logger.error(`❌ Failed job ${job.id}: ${e?.message || e}`);
      throw e;
    }
  }
}

