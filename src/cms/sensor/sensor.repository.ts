import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class CmsSensorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllSensorLog({
    instansi_id,
    search,
    limit = 50,
    offset = 0,
    orderBy = 'id',
    orderDirection = 'desc',
  }: {
    instansi_id?: number;
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }) {
    const allowedOrderBy = [
      'id',
      'sensor_uid',
      'device_uid',
      'name',
      'created_at',
      'updated_at',
      'last_sending_data',
    ];
    const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'id';
    const safeDirection = orderDirection === 'asc' ? 'asc' : 'desc';

    const params: any[] = [];
    let where = `WHERE 1 = 1`;

    // --- SEARCH di tr_sensor_log ---
    if (search) {
      where += ` AND (
      tr.name ILIKE $${params.length + 1} OR
      tr.m_sensor.sensor_type ILIKE $${params.length + 1}
    )`;
      params.push(`%${search}%`);
    }

    // --- Filter instansi ---
    if (instansi_id) {
      where += ` AND m_device.instansi_id = $${params.length + 1}`;
      params.push(instansi_id);
    }

    // push limit + offset
    params.push(limit);
    params.push(offset);

    const query = `
      SELECT
        tr.id::text AS id,
        tr.sensor_uid,
        tr.device_uid,
        tr.name AS log_name,
        tr.unit,
        tr.value,
        tr.value_change,
        tr.debit,
        tr.last_sending_data,
        tr.created_at,
        tr.updated_at,

        m_sensor.name AS sensor_name,
        m_sensor.sensor_type AS sensor_type,
        m_sensor.elevation AS sensor_elevation,
        m_sensor.years_data,
        m_sensor.criteria_id AS sensor_criteria_id,
        m_sensor.criteria_status AS sensor_criteria_status,

        m_device.instansi_id,
        m_device.device_tag_id
      FROM tr_sensor_log tr
      LEFT JOIN m_sensor ON m_sensor.sensor_uid = tr.sensor_uid
      LEFT JOIN m_device ON m_device.device_uid = tr.device_uid
      ${where}
      ORDER BY ${safeOrderBy} ${safeDirection}
      LIMIT $${params.length - 1}
      OFFSET $${params.length};
    `;

    return await this.prisma.$queryRawUnsafe<any[]>(query, ...params);
  }

  async countAllSensorLog({
    instansi_id,
    search,
  }: {
    search?: string;
    instansi_id?: number;
  }) {
    const params: any[] = [];
    let where = `WHERE 1 = 1`;

    // --- SEARCH di tr_sensor_log (harus sama dengan list) ---
    if (search) {
      where += ` AND (
      tr.name ILIKE $${params.length + 1} OR
      tr.m_sensor.sensor_type ILIKE $${params.length + 1}
    )`;
      params.push(`%${search}%`);
    }

    // --- Filter instansi (harus sama) ---
    if (instansi_id) {
      where += ` AND m_device.instansi_id = $${params.length + 1}`;
      params.push(instansi_id);
    }

    const query = `
    SELECT COUNT(*) AS total
    FROM tr_sensor_log tr
    LEFT JOIN m_sensor ON m_sensor.sensor_uid = tr.sensor_uid
    LEFT JOIN m_device ON m_device.device_uid = tr.device_uid
    ${where};
  `;

    const result = await this.prisma.$queryRawUnsafe<any[]>(query, ...params);
    return Number(result[0]?.total || 0);
  }
}
