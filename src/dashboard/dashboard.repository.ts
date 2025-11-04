import { Injectable } from '@nestjs/common';
import { WilayahFilter } from './dashboard.service';
import { PrismaService } from 'src/common/prisma.service';

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

    // 🔹 Query utama
    return this.prisma.$queryRaw`
      SELECT
        dvc.id,
        dvc.device_uid,
        dvc.device_tag_id,
        dvc.das_id,
        dvc.sungai_id,
        dvc.owner,
        dvc.name AS device_name,
        dvc.name_type,
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
        d.name AS das_name,
        p.code AS provinsi_code,
        p.name AS provinsi_name,
        k.code AS kab_kota_code,
        k.name AS kab_kota_name,
        kc.code AS kecamatan_code,
        kc.name AS kecamatan_name,
        kd.code AS kel_des_code,
        kd.name AS kel_des_name
      FROM m_device dvc
      LEFT JOIN m_das d ON d.id = dvc.das_id
      LEFT JOIN m_provinsi p ON p.code = d.provinsi_code
      LEFT JOIN m_kab_kota k ON k.code = d.kab_kota_code
      LEFT JOIN m_kecamatan kc ON kc.code = d.kecamatan_code
      LEFT JOIN m_kel_des kd ON kd.code = d.kel_des_code
      WHERE
        (
          ${isSearchEmpty} OR
          LOWER(dvc.name) LIKE ${keyword} OR
          LOWER(d.name) LIKE ${keyword} OR
          LOWER(p.name) LIKE ${keyword} OR
          LOWER(k.name) LIKE ${keyword} OR
          LOWER(kc.name) LIKE ${keyword} OR
          LOWER(kd.name) LIKE ${keyword}
        )
        AND (${!provinsi_code} OR p.code = ${provinsi_code})
        AND (${!kab_kota_code} OR k.code = ${kab_kota_code})
        AND (${!kecamatan_code} OR kc.code = ${kecamatan_code})
        AND (${!kel_des_code} OR kd.code = ${kel_des_code})
        AND 
        (
          ${!device_tag_id || device_tag_id.length === 0}
          OR dvc.device_tag_id && ${device_tag_id}::int[]
        )
      ORDER BY dvc.name ASC
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
      LEFT JOIN m_provinsi p ON p.code = d.provinsi_code
      LEFT JOIN m_kab_kota k ON k.code = d.kab_kota_code
      LEFT JOIN m_kecamatan kc ON kc.code = d.kecamatan_code
      LEFT JOIN m_kel_des kd ON kd.code = d.kel_des_code
      -- WHERE (
      --   ${cleanSearch === ''} OR
      --   LOWER(dvc.name) LIKE ${keyword} OR
      --   LOWER(d.name) LIKE ${keyword} OR
      --   LOWER(p.name) LIKE ${keyword}
      -- );
    `;

    return result[0]?.count ?? 0;
  }
}
