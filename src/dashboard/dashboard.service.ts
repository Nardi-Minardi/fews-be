import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';

export type WilayahFilter = {
  provinsi_code?: string;
  kab_kota_code?: string;
  kecamatan_code?: string;
  kel_des_code?: string;
};

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  getDas(filters?: WilayahFilter) {
    return this.dashboardRepository.listDas(filters);
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
    const data = await this.dashboardRepository.listDevices(
      limit,
      offset,
      search,
      provinsi_code,
      kab_kota_code,
      kecamatan_code,
      kel_des_code,
      device_tag_id,
    );
    const total_data = await this.dashboardRepository.countDevices();
    return { total_data, limit, offset, data };
  }
}
