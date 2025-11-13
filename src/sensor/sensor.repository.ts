import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';
import { PayloadTelemetryDto } from './dto/create-telemetry.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class SensorRepository {
  @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger;
  constructor(private readonly prisma: PrismaService) {}

  async insertSensorsLog(payload: any) {
    const { device_id, sensors } = payload;

    const device = await this.prisma.m_device.findUnique({
      where: { device_uid: device_id },
    });
    if (!device) throw new Error(`Device ${device_id} not found`);

    const sensorUIDs = sensors.map((s) => s.sensor_id);
    const mSensors = await this.prisma.m_sensor.findMany({
      where: { sensor_uid: { in: sensorUIDs } },
    });

    const logData = sensors
      .map((s) => {
        const mSensor = mSensors.find((ms) => ms.sensor_uid === s.sensor_id);
        if (!mSensor) {
          this.logger.warn(
            `⚠️ Sensor skipped, sensor_id missing or not found: ${JSON.stringify(s)}`,
          );
          return null;
        }
        return {
          device_uid: device_id,
          sensor_uid: mSensor.sensor_uid,
          name: s.name,
          value: s.value ?? 0,
          unit: s.unit ?? '',
          last_sending_data: new Date(s.last_sending_data),
          created_at: new Date(),
          updated_at: new Date(),
        };
      })
      .filter(Boolean);

    if (!logData.length)
      return { device_uid: device.device_uid, total_logs: 0 };

    await this.prisma.tr_sensor_log.createMany({ data: logData });
    return { device_uid: device.device_uid, total_logs: logData.length };
  }

  async getSensorsByDeviceUid(device_uid: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT 
        s.id, s.sensor_uid, s.device_uid, s.name, s.unit, s.sensor_type,
        s.criteria_id, s.criteria_status, s.value, s.value_change, s.debit,
        s.last_sending_data, s.created_at, s.updated_at, s.elevation, s.years_data,
        dvc.device_tag_id as device_tag_id
      FROM tr_sensor_log s
      LEFT JOIN m_device dvc ON dvc.device_uid = s.device_uid
      WHERE s.device_uid = ${device_uid}
      ORDER BY s.updated_at DESC
    `;

    return rows.map((s) => {
      let abs_water_level: number | null = null;
      if (s.sensor_type === 'water_level' && s.value != null) {
        const val = Number(s.value);
        const elev = Number(s.elevation ?? 0);
        const unit = String(s.unit || '').toLowerCase();
        const meters =
          unit === 'mm' ? val / 1000 : unit === 'cm' ? val / 100 : val;
        abs_water_level = Math.round((elev + meters) * 100) / 100;
      }
      return { ...s, abs_water_level };
    });
  }
}
