import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';
import { GeocodeService } from 'src/common/geocode.service';
import { PrismaService } from 'src/common/prisma.service';
import { toLocalTimeString } from 'src/common/utils/timeLocal';

export type WilayahFilter = {
  provinsi_code?: string;
  kab_kota_code?: string;
  kecamatan_code?: string;
  kel_des_code?: string;
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly geocode: GeocodeService,
    private readonly prisma: PrismaService,
  ) {}

  async getDas(filters?: WilayahFilter) {
    const results = await this.dashboardRepository.listDas(filters);
    return results;
  }

  async getDevices(
    limit?: number,
    offset?: number,
    search?: string,
    provinsi_code?: string,
    kab_kota_code?: string,
    kecamatan_code?: string,
    kel_des_code?: string,
    device_tag_id?: number[],
    instansi_id?: number | null,
  ) {
    let data = (await this.dashboardRepository.listDevices(
      limit,
      offset,
      search,
      provinsi_code,
      kab_kota_code,
      kecamatan_code,
      kel_des_code,
      device_tag_id,
      instansi_id,
    )) as any[];

    // Enrich missing region codes using reverse geocoding as last resort
    const needsFilter = !!(
      provinsi_code ||
      kab_kota_code ||
      kecamatan_code ||
      kel_des_code
    );
    const enriched = await Promise.all(
      data.map(async (row) => {
        if (
          !row?.provinsi_code &&
          typeof row?.lat === 'number' &&
          typeof row?.long === 'number'
        ) {
          //sementara matikan reverse geocode
          // const rev = await this.geocode.reverse(row.lat, row.long);
          const rev: {
            province?: string;
            kabKota?: string;
            kecamatan?: string;
            kelDes?: string;
          } = {}; // dummy
          if (rev?.province) {
            const prov = await this.prisma.m_provinsi.findFirst({
              where: { name: { contains: rev.province, mode: 'insensitive' } },
              select: { code: true, name: true },
            });
            if (prov?.code) {
              row.provinsi_code = prov.code;
              row.provinsi_name = prov.name;
            }
          }
          if (rev?.kabKota) {
            const kab = await this.prisma.m_kab_kota.findFirst({
              where: {
                name: { contains: rev.kabKota, mode: 'insensitive' },
              },
              select: { code: true, name: true },
            });
            if (kab?.code) {
              row.kab_kota_code = kab.code;
              row.kab_kota_name = kab.name;
            }
          }
          if (rev?.kecamatan) {
            const kc = await this.prisma.m_kecamatan.findFirst({
              where: {
                name: { contains: rev.kecamatan, mode: 'insensitive' },
              },
              select: { code: true, name: true },
            });
            if (kc?.code) {
              row.kecamatan_code = kc.code;
              row.kecamatan_name = kc.name;
            }
          }
          if (rev?.kelDes) {
            const kd = await this.prisma.m_kel_des.findFirst({
              where: {
                name: { contains: rev.kelDes, mode: 'insensitive' },
              },
              select: { code: true, name: true },
            });
            if (kd?.code) {
              row.kel_des_code = kd.code;
              row.kel_des_name = kd.name;
            }
          }
        }
        return row;
      }),
    );

    if (needsFilter) {
      enriched.splice(
        0,
        enriched.length,
        ...enriched.filter(
          (r) =>
            (!provinsi_code || r.provinsi_code === provinsi_code) &&
            (!kab_kota_code || r.kab_kota_code === kab_kota_code) &&
            (!kecamatan_code || r.kecamatan_code === kecamatan_code) &&
            (!kel_des_code || r.kel_des_code === kel_des_code),
        ),
      );
    }

    data = enriched;
    const total_data = await this.dashboardRepository.countDevices();
    return { total_data, limit, offset, data };
  }

  async getDeviceSensorsWithCriteria(device_uid: string) {
    // Fetch raw sensors
    const sensors =
      await this.dashboardRepository.getSensorsByDeviceUidToday(device_uid);
    if (!sensors.length) return { sensors: [], criteria: [], total_data: 0 };

    // Load all criteria masters (ARR / AWLR / AWS)
    const masters = await this.prisma.m_criteria.findMany({
      orderBy: { id: 'asc' },
    });

    // Konversi created_at / updated_at ke WIB
    const mastersWIB = masters.map((m) => ({
      ...m,
      created_at: m.created_at
        ? toLocalTimeString(m.created_at, 'Asia/Jakarta')
        : null,
      updated_at: m.updated_at
        ? toLocalTimeString(m.updated_at, 'Asia/Jakarta')
        : null,
    }));

    // Map by name
    const byName: Record<string, any> = {};
    for (const m of mastersWIB) byName[m.name] = m;

    const arrCriteria: any[] = Array.isArray(byName['ARR']?.criteria)
      ? (byName['ARR'].criteria as any[])
      : [];
    const awlrCriteria: any[] = Array.isArray(byName['AWLR']?.criteria)
      ? (byName['AWLR'].criteria as any[])
      : [];

    const classify = (criteriaArr: any[], val: number) => {
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

    const mapped = sensors.map((s) => {
      const valueNum = s.value != null ? Number(s.value) : null;
      const unit = String(s.unit || '').toLowerCase();
      const isRain =
        (s.sensor_type || '').toLowerCase().includes('rain') ||
        s.name?.toLowerCase().includes('rain');
      const isWater =
        (s.sensor_type || '').toLowerCase().includes('water') ||
        s.name?.toLowerCase().includes('water');

      let elevation_water: number | null = null;
      if (isWater && valueNum != null) {
        const elev = s.elevation != null ? Number(s.elevation) : 0;
        const meters =
          unit === 'mm'
            ? valueNum / 1000
            : unit === 'cm'
              ? valueNum / 100
              : valueNum;
        elevation_water = Math.round((elev + meters) * 100) / 100;
      }

      const tagIds: number[] = Array.isArray(s.device_tag_id)
        ? s.device_tag_id
        : [];
      let criteriaMaster: any = null;
      if (isRain) criteriaMaster = byName['ARR'] || null;
      else if (isWater) criteriaMaster = byName['AWLR'] || null;
      else criteriaMaster = null;

      let classification: {
        level: number;
        name: string;
        color: string | null;
        icon: string | null;
      } | null = null;
      if (criteriaMaster?.criteria && valueNum != null) {
        const cArr = criteriaMaster.criteria as any[];
        classification = classify(cArr, valueNum);
      }

      return {
        ...s,
        value: valueNum,
        elevation_water,
        criteria_master: criteriaMaster
          ? {
              id: criteriaMaster.id,
              name: criteriaMaster.name,
              created_at: criteriaMaster.created_at, // WIB
              updated_at: criteriaMaster.updated_at, // WIB
            }
          : null,
        criteria_status: classification?.level ?? null,
        criteria_label: classification?.name ?? (criteriaMaster ? '-' : '-'),
        criteria_color:
          classification?.color ?? (criteriaMaster ? '#CCCCCC' : '#CCCCCC'),
        criteria_icon: classification?.icon ?? null,
      };
    });

    return { sensors: mapped, criteria: mastersWIB, total_data: mapped.length };
  }

  async getDevicesTable(
    limit?: number,
    offset?: number,
    search?: string,
    provinsi_code?: string,
    kab_kota_code?: string,
    kecamatan_code?: string,
    kel_des_code?: string,
    device_tag_id?: number[],
    instansi_id?: number | null,
    hidrologi_type?: string,
  ) {
    let data = (await this.dashboardRepository.listDevicesTable(
      limit,
      offset,
      search,
      provinsi_code,
      kab_kota_code,
      kecamatan_code,
      kel_des_code,
      device_tag_id,
      instansi_id,
      hidrologi_type,
    )) as any[];

    // Enrich missing region codes using reverse geocoding as last resort
    const needsFilter = !!(
      provinsi_code ||
      kab_kota_code ||
      kecamatan_code ||
      kel_des_code
    );
    const enriched = await Promise.all(
      data.map(async (row) => {
        if (
          !row?.provinsi_code &&
          typeof row?.lat === 'number' &&
          typeof row?.long === 'number'
        ) {
          if (row.sensor_last_sending_data) {
            row.sensor_last_sending_data = toLocalTimeString(
              row.sensor_last_sending_data,
              'Asia/Jakarta',
            );
          }

          //sementara matikan reverse geocode
          // const rev = await this.geocode.reverse(row.lat, row.long);
          const rev: {
            province?: string;
            kabKota?: string;
            kecamatan?: string;
            kelDes?: string;
          } = {}; // dummy
          if (rev?.province) {
            const prov = await this.prisma.m_provinsi.findFirst({
              where: { name: { contains: rev.province, mode: 'insensitive' } },
              select: { code: true, name: true },
            });
            if (prov?.code) {
              row.provinsi_code = prov.code;
              row.provinsi_name = prov.name;
            }
          }
          if (rev?.kabKota) {
            const kab = await this.prisma.m_kab_kota.findFirst({
              where: {
                name: { contains: rev.kabKota, mode: 'insensitive' },
              },
              select: { code: true, name: true },
            });
            if (kab?.code) {
              row.kab_kota_code = kab.code;
              row.kab_kota_name = kab.name;
            }
          }
          if (rev?.kecamatan) {
            const kc = await this.prisma.m_kecamatan.findFirst({
              where: {
                name: { contains: rev.kecamatan, mode: 'insensitive' },
              },
              select: { code: true, name: true },
            });
            if (kc?.code) {
              row.kecamatan_code = kc.code;
              row.kecamatan_name = kc.name;
            }
          }
          if (rev?.kelDes) {
            const kd = await this.prisma.m_kel_des.findFirst({
              where: {
                name: { contains: rev.kelDes, mode: 'insensitive' },
              },
              select: { code: true, name: true },
            });
            if (kd?.code) {
              row.kel_des_code = kd.code;
              row.kel_des_name = kd.name;
            }
          }
        }
        return row;
      }),
    );

    if (needsFilter) {
      enriched.splice(
        0,
        enriched.length,
        ...enriched.filter(
          (r) =>
            (!provinsi_code || r.provinsi_code === provinsi_code) &&
            (!kab_kota_code || r.kab_kota_code === kab_kota_code) &&
            (!kecamatan_code || r.kecamatan_code === kecamatan_code) &&
            (!kel_des_code || r.kel_des_code === kel_des_code),
        ),
      );
    }

    data = enriched;
    const total_data = await this.dashboardRepository.countDevicesTable();
    return { total_data, limit, offset, data };
  }
}
