import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';
import { PayloadTelemetryDto } from './dto/create-telemetry.dto';

@Injectable()
export class SensorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertSensors(payload: PayloadTelemetryDto) {
    const {
      device_id,
      timestamp,
      sensors,
      name,
      device_status,
      value,
      lat,
      long,
      last_battery,
      last_signal,
      hidrologi_type,
      das_id,
      device_tag_id,
    } = payload;
    const new_das_id: number | null = das_id ?? null;

    return this.prisma.$transaction(async (tx) => {
      // Upsert m_device (buat kalau belum ada)
      const device = await tx.m_device.upsert({
        where: { device_uid: device_id },
        update: {
          name: name,
          device_status: device_status,
          last_sending_data: new Date(timestamp),
          value: value,
          lat: lat,
          long: long,
          last_battery: last_battery,
          last_signal: last_signal,
          hidrologi_type: hidrologi_type,
          das_id: new_das_id,
          device_tag_id:
            Array.isArray(device_tag_id) && device_tag_id.length
              ? device_tag_id
              : undefined,
          updated_at: new Date(),
        },
        create: {
          device_uid: device_id,
          name: name,
          device_status: device_status,
          last_sending_data: new Date(timestamp),
          value: value,
          lat: lat,
          long: long,
          last_battery: last_battery,
          last_signal: last_signal,
          hidrologi_type: hidrologi_type,
          das_id: new_das_id,
          device_tag_id:
            Array.isArray(device_tag_id) && device_tag_id.length
              ? device_tag_id
              : undefined,
        },
      });

      // Upsert setiap sensor yang dikirim
      const sensorOps = sensors.map((sensor) =>
        tx.tr_sensor.upsert({
          where: {
            device_uid_sensor_uid: {
              device_uid: device_id,
              sensor_uid: sensor.sensor_id,
            },
          },
          update: {
            value: sensor.value,
            last_sending_data: new Date(timestamp),
            elevation: sensor.elevation,
            years_data: sensor.years_data,
            updated_at: new Date(),
          },
          create: {
            device_id: device.id,
            device_uid: device_id,
            sensor_uid: sensor.sensor_id,
            name: sensor.name,
            unit: sensor.unit,
            sensor_type: sensor.sensor_type,
            value: sensor.value,
            value_change: sensor.value_change,
            criteria_id: sensor.criteria_id,
            criteria_status: sensor.criteria_status,
            debit: sensor.debit,
            elevation: sensor.elevation,
            years_data: sensor.years_data,
            last_sending_data: new Date(timestamp),
          },
        }),
      );

      await Promise.all(sensorOps);
      // Return device-centric payload for websocket broadcast
      return {
        id: device.id,
        device_uid: device.device_uid,
        device_name: device.name,
        lat: device.lat,
        long: device.long,
        value,
        last_sending_data: new Date(timestamp).toISOString(),
        device_status,
        hidrologi_type,
        sensors: sensors.map((s) => ({
          sensor_uid: s.sensor_id,
          name: s.name,
          unit: s.unit,
          sensor_type: s.sensor_type,
          value: s.value,
          elevation: s.elevation,
          years_data: s.years_data,
        })),
      };
    });
  }

  async getSensorsByDeviceUid(device_uid: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT 
        s.id, s.sensor_uid, s.device_uid, s.name, s.unit, s.sensor_type,
        s.criteria_id, s.criteria_status, s.value, s.value_change, s.debit,
        s.last_sending_data, s.created_at, s.updated_at, s.elevation, s.years_data,
        dvc.device_tag_id as device_tag_id
      FROM tr_sensor s
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
        const meters = unit === 'mm' ? val / 1000 : unit === 'cm' ? val / 100 : val;
        abs_water_level = Math.round((elev + meters) * 100) / 100;
      }
      return { ...s, abs_water_level };
    });
  }
}
