import { Injectable } from '@nestjs/common';
import { SensorRepository } from './sensor.repository';
import { DasRepository } from 'src/das/das.repository';
import { ValidationService } from 'src/common/validation.service';
import { SensorValidation } from './sensor.validation';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { DeviceRepository } from 'src/device/device.repostiory';

@Injectable()
export class SensorService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private readonly validationService: ValidationService,
    private readonly sensorRepository: SensorRepository,
    private readonly dasRepository: DasRepository,
  private readonly deviceRepository: DeviceRepository,
  ) {}

  async storeSensor(request: any): Promise<any> {
    this.logger.debug('storing sensor data', {
      request,
    });

    const createRequest = this.validationService.validate(
      SensorValidation.postTelemetrySchema,
      request,
    );

    if (createRequest.device_type === 'ARR') {
      createRequest.name_type = 'PCH';
    } else if (createRequest.device_type === 'AWLR') {
      createRequest.name_type = 'PDA';
    } else if (createRequest.device_type === 'AWS') {
      createRequest.name_type = 'Pos Cuaca';
    } else {
      createRequest.name_type = 'Other';
    }

    // Resolve das based on point (lat, long)
    let das: any = null;
    try {
      das = await this.dasRepository.findDasByPointDetailed(
        createRequest.lat,
        createRequest.long,
      );
    } catch (e) {
      this.logger.warn('Failed to resolve das from lat/long', {
        error: (e as any)?.message,
      });
    }

    // Resolve device_tag_id from device_type
    let device_tag_id: number[] = [];
    try {
      const tagId = await this.deviceRepository.getTagIdByType(createRequest.device_type as any);
      if (typeof tagId === 'number') device_tag_id = [tagId];
    } catch (e) {
      this.logger.warn('Failed to resolve device_tag_id from device_type', { error: (e as any)?.message });
    }

    const createData = {
      device_id: createRequest.device_id,
      name: createRequest.name,
      device_type: createRequest.device_type,
      device_status: createRequest.device_status,
      timestamp: createRequest.timestamp,
      last_battery: createRequest.last_battery,
      last_signal: createRequest.last_signal,
      lat: createRequest.lat,
      long: createRequest.long,
      das_id: das?.id ?? null,
      device_tag_id,
      value: createRequest.value,
      cctv_url: createRequest.cctv_url,
      sensors: createRequest.sensors,

      name_type: createRequest.name_type,
    };

    const result = await this.sensorRepository.upsertSensors(createData);

    return result;
  }
}
