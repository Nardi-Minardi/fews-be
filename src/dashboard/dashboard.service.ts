import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';
import { GeocodeService } from 'src/common/geocode.service';
import { PrismaService } from 'src/common/prisma.service';

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
}
