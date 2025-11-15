import { Injectable } from '@nestjs/common';
import { SensorRepository } from './sensor.repository';
import { DasRepository } from 'src/das/das.repository';
import { ValidationService } from 'src/common/validation.service';
import { SensorValidation } from './sensor.validation';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { DeviceRepository } from 'src/device/device.repostiory';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class SensorService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private readonly validationService: ValidationService,
    private readonly sensorRepository: SensorRepository,
    private readonly dasRepository: DasRepository,
    private readonly deviceRepository: DeviceRepository,
    private readonly prisma: PrismaService,
  ) {}

 async storeSensor(request: any): Promise<any> {
    this.logger.debug('storing sensor data#1', { request });

    const createRequest = this.validationService.validate(
      SensorValidation.postTelemetrySchema,
      request,
    );

    const createData = {
      device_id: createRequest.device_id,
      sensors: createRequest.sensors,
    };

    this.logger.debug('storing sensor data#2', { createData });

    return this.sensorRepository.insertSensorsLog(createData);
  }

  // Merge sensors with criteria master to classify sensors into levels
  async getSensorsWithCriteriaByDeviceUid(device_uid: string) {
    const sensors =
      await this.sensorRepository.getSensorsByDeviceUid(device_uid);
    if (!sensors.length) {
      return { total: 0, sensors: [], criteria: [] };
    }

    // Load all criteria masters
    const masters = await this.prisma.m_criteria.findMany({
      orderBy: { id: 'asc' },
    });
    const byTagId = new Map<number, any>();
    for (const m of masters) {
      if (m.device_tag_id != null) byTagId.set(m.device_tag_id, m);
    }

    // Helper to classify by range
    const classify = (criteriaArr: any[] | null | undefined, val: number) => {
      if (!Array.isArray(criteriaArr)) return null;
      for (const c of criteriaArr) {
        const startOk = val >= Number(c.start);
        const toOk = c.to == null ? true : val <= Number(c.to);
        if (startOk && toOk)
          return {
            level: c.level,
            name: c.name,
            color: c.color ?? null,
            icon: c.icon ?? null,
          };
      }
      return null;
    };

    const enriched = sensors.map((s: any) => {
      const tagIds: number[] = Array.isArray(s.device_tag_id)
        ? s.device_tag_id
        : [];
      const tagId = tagIds[0];
      let criteriaMaster: any = tagId != null ? byTagId.get(tagId) : undefined;
      let criteriaMatch: any = null;
      if (
        criteriaMaster &&
        s.value != null &&
        (s.sensor_type?.toLowerCase() === 'rainfall' ||
          s.name?.toLowerCase().includes('rain'))
      ) {
        criteriaMatch = classify(
          criteriaMaster.criteria as any[],
          Number(s.value),
        );
      }
      return {
        ...s,
        criteria_master: criteriaMaster ?? null,
        criteria_status: criteriaMatch?.level ?? s.criteria_status ?? null,
        criteria_label: criteriaMatch?.name ?? null,
        criteria_color: criteriaMatch?.color ?? null,
        criteria_icon: criteriaMatch?.icon ?? null,
      };
    });

    return { total: enriched.length, sensors: enriched, criteria: masters };
  }
}
