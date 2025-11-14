import { Injectable } from '@nestjs/common';
import { WilayahFilter } from './dashboard.service';
import { PrismaService } from 'src/common/prisma.service';
import { toLocalTimeString } from 'src/common/utils/timeLocal';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listDas(filters?: WilayahFilter) {
    const f = filters || {};
    const hasAny = !!(
      f.provinsi_code ||
      f.kab_kota_code ||
      f.kecamatan_code ||
      f.kel_des_code
    );
    if (hasAny) {
      return this.prisma.$queryRaw<any[]>`
        SELECT 
          d.id, d.sungai_id, d.das_uid, d.kode_das, d.name, d.luas, d.ws_uid, d.color,
          CASE WHEN d.geom IS NULL THEN NULL ELSE ST_AsGeoJSON(d.geom)::json END as geom,
          d.created_at, d.updated_at, d.provinsi_code,
          d.kab_kota_code, d.kecamatan_code, d.kel_des_code,
          p.name AS provinsi_name,
          k.name AS kab_kota_name,
          kc.name AS kecamatan_name,
          kd.name AS kel_des_name
        FROM m_das d
        LEFT JOIN m_provinsi p ON p.code = d.provinsi_code
        LEFT JOIN m_kab_kota k ON k.code = d.kab_kota_code
        LEFT JOIN m_kecamatan kc ON kc.code = d.kecamatan_code
        LEFT JOIN m_kel_des kd ON kd.code = d.kel_des_code
        WHERE (
          ${!!f.provinsi_code} AND d.provinsi_code = ${f.provinsi_code}
          OR ${!!f.kab_kota_code} AND d.kab_kota_code = ${f.kab_kota_code}
          OR ${!!f.kecamatan_code} AND d.kecamatan_code = ${f.kecamatan_code}
          OR ${!!f.kel_des_code} AND d.kel_des_code = ${f.kel_des_code}
        )
        ORDER BY name ASC
      `;
    }
    return this.prisma.$queryRaw<any[]>`
      SELECT 
        d.id, d.sungai_id, d.das_uid, d.kode_das, d.name, d.luas, d.ws_uid, d.color,
        CASE WHEN d.geom IS NULL THEN NULL ELSE ST_AsGeoJSON(d.geom)::json END as geom,
        d.created_at, d.updated_at, d.provinsi_code,
        d.kab_kota_code, d.kecamatan_code, d.kel_des_code,
        p.name AS provinsi_name,
        k.name AS kab_kota_name,
        kc.name AS kecamatan_name,
        kd.name AS kel_des_name
      FROM m_das d
      LEFT JOIN m_provinsi p ON p.code = d.provinsi_code
      LEFT JOIN m_kab_kota k ON k.code = d.kab_kota_code
      LEFT JOIN m_kecamatan kc ON kc.code = d.kecamatan_code
      LEFT JOIN m_kel_des kd ON kd.code = d.kel_des_code
      ORDER BY name ASC
    `;
  }

  async listDevices(
    limit = 50,
    offset = 0,
    search?: string,
    provinsi_code?: string,
    kab_kota_code?: string,
    kecamatan_code?: string,
    kel_des_code?: string,
    device_tag_id?: number[],
  ) {
    const cleanSearch =
      search?.trim().replace(/^[“”"'']+|[“”"'']+$/g, '') ?? '';
    const keyword = `%${cleanSearch.toLowerCase()}%`;
    const isSearchEmpty = cleanSearch === '';

    //Query utama
    return this.prisma.$queryRaw`
      SELECT
        dvc.id,
        dvc.device_uid,
        dvc.device_tag_id,
        dvc.das_id,
        dvc.sungai_id,
        dvc.owner,
        dvc.name AS device_name,
        dvc.hidrologi_type,
        dvc.device_status,
        dvc.last_sending_data,
        dvc.last_battery, 
        dvc.last_signal,
        dvc.lat,
        dvc.long,
        dvc.cctv_url,
        dvc.value,
        dvc.created_at,
        dvc.updated_at,
        d.name AS das_name
       
      FROM m_device dvc
      LEFT JOIN m_das d ON d.id = dvc.das_id
     
      WHERE
        (
          ${isSearchEmpty} OR
          LOWER(dvc.name) LIKE ${keyword} OR
          LOWER(d.name) LIKE ${keyword}
        )
       
        AND 
        (
          ${!device_tag_id || device_tag_id.length === 0}
          OR dvc.device_tag_id && ${device_tag_id}::int[]
        )
      ORDER BY dvc.updated_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;
  }

  async countDevices(search?: string) {
    const cleanSearch =
      search?.trim().replace(/^[“”"'']+|[“”"'']+$/g, '') ?? '';
    const keyword = `%${cleanSearch.toLowerCase()}%`;

    const result: Array<{ count: number }> = await this.prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM m_device dvc
      LEFT JOIN m_das d ON d.id = dvc.das_id
      -- WHERE (
      --   ${cleanSearch === ''} OR
      --   LOWER(dvc.name) LIKE ${keyword} OR
      --   LOWER(d.name) LIKE ${keyword} OR
      --   LOWER(p.name) LIKE ${keyword}
      -- );
    `;

    return result[0]?.count ?? 0;
  }

  async listDevicesTable(
    limit = 50,
    offset = 0,
    search?: string,
    provinsi_code?: string,
    kab_kota_code?: string,
    kecamatan_code?: string,
    kel_des_code?: string,
    device_tag_id?: number[],
  ) {
    const cleanSearch =
      search?.trim().replace(/^[“”"'']+|[“”"'']+$/g, '') ?? '';
    const keyword = `%${cleanSearch.toLowerCase()}%`;
    const isSearchEmpty = cleanSearch === '';

    //Query utama
    return this.prisma.$queryRaw`
      SELECT
        dvc.id,
        dvc.device_uid,
        dvc.device_tag_id,
        dvc.das_id,
        dvc.sungai_id,
        dvc.owner,
        dvc.name AS device_name,
        dvc.hidrologi_type,
        dvc.device_status,
        dvc.last_sending_data,
        dvc.last_battery, 
        dvc.last_signal,
        dvc.lat,
        dvc.long,
        dvc.cctv_url,
        dvc.value,
        dvc.created_at,
        dvc.updated_at,
        d.name AS das_name
       
      FROM m_device dvc
      LEFT JOIN m_das d ON d.id = dvc.das_id
     
      WHERE
        (
          ${isSearchEmpty} OR
          LOWER(dvc.name) LIKE ${keyword} OR
          LOWER(d.name) LIKE ${keyword}
        )
       
        AND 
        (
          ${!device_tag_id || device_tag_id.length === 0}
          OR dvc.device_tag_id && ${device_tag_id}::int[]
        )
      ORDER BY dvc.updated_at DESC
      LIMIT ${limit} OFFSET ${offset};
    `;
  }

  async countDevicesTable(search?: string) {
    const cleanSearch =
      search?.trim().replace(/^[“”"'']+|[“”"'']+$/g, '') ?? '';
    const keyword = `%${cleanSearch.toLowerCase()}%`;

    const result: Array<{ count: number }> = await this.prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM m_device dvc
      LEFT JOIN m_das d ON d.id = dvc.das_id
      -- WHERE (
      --   ${cleanSearch === ''} OR
      --   LOWER(dvc.name) LIKE ${keyword} OR
      --   LOWER(d.name) LIKE ${keyword} OR
      --   LOWER(p.name) LIKE ${keyword}
      -- );
    `;

    return result[0]?.count ?? 0;
  }

  async getSensorsByDeviceUid(device_uid: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT 
        s.id, s.sensor_uid, s.device_uid, s.name, s.unit, s.sensor_type,
        s.criteria_id, s.criteria_status, s.value, s.value_change, s.debit,
        s.last_sending_data, s.created_at, s.updated_at, s.elevation, s.years_data,
        dvc.device_tag_id AS device_tag_id
      FROM tr_sensor_log s
      LEFT JOIN m_device dvc ON dvc.device_uid = s.device_uid
      WHERE s.device_uid = ${device_uid}
      ORDER BY s.updated_at DESC
    `;

    // Compute absolute water level for water_level sensors
    const mapped = rows.map((s) => {
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

    return mapped;
  }

  async getSensorsByDeviceUidToday(device_uid: string) {
    // Ambil sensor dari log hari ini UTC
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT 
        sl.id::text, sl.sensor_uid, sl.device_uid, sl.name, sl.unit, sl.sensor_type,
        sl.criteria_id, sl.criteria_status, sl.value, sl.value_change, sl.debit,
        sl.last_sending_data, sl.created_at, sl.updated_at, sl.elevation, sl.years_data,
        dvc.device_tag_id AS device_tag_id, s.sensor_type AS sensor_type
      FROM tr_sensor_log sl
      LEFT JOIN m_device dvc ON dvc.device_uid = sl.device_uid
      LEFT JOIN m_sensor s ON sl.sensor_uid = s.sensor_uid
      WHERE sl.device_uid = ${device_uid}
      --AND sl.last_sending_data >= timezone('UTC', CURRENT_DATE)
      ORDER BY sl.last_sending_data ASC
    `;

    const mapped = rows.map((s) => {
      let abs_water_level: number | null = null;
      if (s.sensor_type === 'water_level' && s.value != null) {
        const val = Number(s.value);
        const elev = Number(s.elevation ?? 0);
        const unit = String(s.unit || '').toLowerCase();
        const meters =
          unit === 'mm' ? val / 1000 : unit === 'cm' ? val / 100 : val;
        abs_water_level = Math.round((elev + meters) * 100) / 100;
      }

      // Konversi UTC ke WIB (UTC+7)
      const last_sending_wib = new Date(
        new Date(s.last_sending_data).getTime() + 7 * 60 * 60 * 1000,
      )
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19); // format: YYYY-MM-DD HH:mm:ss

      const created_at_wib = new Date(
        new Date(s.created_at).getTime() + 7 * 60 * 60 * 1000,
      )
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19); // format: YYYY-MM-DD HH:mm:ss

      const updated_at_wib = new Date(
        new Date(s.updated_at).getTime() + 7 * 60 * 60 * 1000,
      )
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19); // format: YYYY-MM-DD HH:mm:ss

      return {
        ...s,
        abs_water_level,
        last_sending_data: toLocalTimeString(
          s.last_sending_data,
          'Asia/Jakarta',
        ),
        created_at: toLocalTimeString(s.last_sending_data, 'Asia/Jakarta'),
        updated_at: toLocalTimeString(s.last_sending_data, 'Asia/Jakarta'),
      };
    });

    return mapped;
  }
}
