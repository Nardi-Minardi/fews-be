import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Inject } from '@nestjs/common';
import { SensorService } from './sensor.service';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Processor('telemetry')
@Injectable()
@Processor('telemetry')
@Injectable()
export class TelemetryProcessor {

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly sensorService: SensorService,
    private readonly wsGateway: WebsocketGateway,
  ) {}

  @Process()
  async handle(job: Job<any>) {
    try {
      this.logger.info(`Processing job ${job.id} with data`, job.data);
      const payload = job.data;
      const result = await this.sensorService.storeSensor(payload);

      // kirim notifikasi ke FE
      this.wsGateway.sendBroadcast('telemetry:update', {
        ...payload,
        device_uid: result.device_uid,
      });

      this.logger.info(`✅ Job ${job.id} processed successfully`);
    } catch (e: any) {
      this.logger.error(`❌ Failed job ${job.id}: ${e?.message || e}`);
      throw e;
    }
  }
}

