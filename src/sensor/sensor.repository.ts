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
      name_type,
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
          name_type: name_type,
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
          name_type: name_type,
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
        value: value,
        last_sending_data: new Date(timestamp).toISOString(),
        device_status: device_status,
        name_type: name_type,
      };
    });
  }
}
