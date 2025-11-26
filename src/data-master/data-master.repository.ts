import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';

export type WilayahLevel = 'provinsi' | 'kab_kota' | 'kecamatan' | 'kel_des';

export interface ListWilayahParams {
  level: WilayahLevel;
  parentCode?: string;
  search?: string;
  page: number;
  limit: number;
}

@Injectable()
export class DataMasterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listWilayah(params: ListWilayahParams) {
    const { level, parentCode, search, page, limit } = params;
    const skip = (page - 1) * limit;

    if (level === 'provinsi') {
      const where: any = {};
      if (search) where.name = { contains: search, mode: 'insensitive' };
      const [data, total] = await Promise.all([
        this.prisma.m_provinsi.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        this.prisma.m_provinsi.count({ where }),
      ]);
      return { data, total };
    }

    if (level === 'kab_kota') {
      const where: any = {};
      if (parentCode) where.provinsi_code = parentCode;
      if (search) where.name = { contains: search, mode: 'insensitive' };
      const [data, total] = await Promise.all([
        this.prisma.m_kab_kota.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        this.prisma.m_kab_kota.count({ where }),
      ]);
      return { data, total };
    }

    if (level === 'kecamatan') {
      const where: any = {};
      if (parentCode) where.kab_kota_code = parentCode;
      if (search) where.name = { contains: search, mode: 'insensitive' };
      const [data, total] = await Promise.all([
        this.prisma.m_kecamatan.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        this.prisma.m_kecamatan.count({ where }),
      ]);
      return { data, total };
    }

    // kel_des
    const where: any = {};
    if (parentCode) where.kecamatan_code = parentCode;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    const [data, total] = await Promise.all([
      this.prisma.m_kel_des.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.m_kel_des.count({ where }),
    ]);
    return { data, total };
  }

  //list master criteria
  async listCriteria(search?: string, page?: number, limit?: number) {
    const skip = ((page || 1) - 1) * (limit || 50);
    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    const [data, total] = await Promise.all([
      this.prisma.m_criteria.findMany({
        where,
        skip,
        take: limit || 50,
        orderBy: { name: 'asc' },
      }),
      this.prisma.m_criteria.count({ where }),
    ]);
    return { data, total };
  }

  //list master instansi
  async listInstansi(search?: string, page?: number, limit?: number, instansiId?: number) {
    const skip = ((page || 1) - 1) * (limit || 50);
    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (instansiId) {
      where.id = instansiId;
    }

    const [data, total] = await Promise.all([
      this.prisma.m_instansi.findMany({
        where,
        skip,
        take: limit || 50,
        orderBy: { name: 'asc' },
      }),
      this.prisma.m_instansi.count({ where }),
    ]);
    return { data, total };
  }

  //find instansi by id
  async findInstansiById(id: number) {
    return this.prisma.m_instansi.findUnique({
      where: { id },
    });
  }

  //list master roles
  async listRoles(search?: string, page?: number, limit?: number) {
    const skip = ((page || 1) - 1) * (limit || 50);
    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    const [data, total] = await Promise.all([
      this.prisma.m_roles.findMany({
        where,
        skip,
        take: limit || 50,
        orderBy: { name: 'asc' },
      }),
      this.prisma.m_roles.count({ where }),
    ]);
    return { data, total };
  }

  //find instansi by id
  async findRoleById(id: number) {
    return this.prisma.m_roles.findUnique({
      where: { id },
    });
  }

  //list master roles
  async listJabatan(search?: string, page?: number, limit?: number) {
    const skip = ((page || 1) - 1) * (limit || 50);
    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    const [data, total] = await Promise.all([
      this.prisma.m_jabatan.findMany({
        where,
        skip,
        take: limit || 50,
        orderBy: { name: 'asc' },
      }),
      this.prisma.m_jabatan.count({ where }),
    ]);
    return { data, total };
  }

  //find instansi by id
  async findJabatanById(id: number) {
    return this.prisma.m_jabatan.findUnique({
      where: { id },
    });
  }
}
