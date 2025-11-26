import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class CmsDeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllDevice({
    instansi_id,
    search,
    limit = 50,
    offset = 0,
    orderBy = 'id',
    orderDirection = 'desc',
    das_ids,
  }: {
    instansi_id?: number;
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    das_ids?: number[];
  }) {
    const whereClause: any = {
      AND: [],
    };

    if (instansi_id) {
      whereClause.AND.push({ instansi_id });
    }

    if (search) {
      whereClause.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { das_name: { contains: search, mode: 'insensitive' } },
          { owner: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (das_ids && das_ids.length > 0) {
      whereClause.AND.push({ das_id: { in: das_ids } });
    }

    // SAFE ORDER CLAUSE
    let orderClause: any = undefined;

    // hanya set jika orderBy valid
    if (orderBy && orderBy.trim() !== '') {
      orderClause = {
        [orderBy]: orderDirection ?? 'asc',
      };
    }

    return this.prisma.m_device.findMany({
      where: whereClause,
      orderBy: orderClause,
      include: {
        m_instansi: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
      skip: offset,
    });
  }

  async countAllDevice({
    instansi_id,
    search,
    das_ids,
  }: {
    instansi_id?: number;
    search?: string;
    das_ids?: number[];
  }) {
    const whereClause: any = {
      AND: [],
    };

    if (instansi_id) {
      whereClause.AND.push({ instansi_id });
    }

    if (search) {
      whereClause.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { das_name: { contains: search, mode: 'insensitive' } },
          { owner: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (das_ids && das_ids.length > 0) {
      whereClause.AND.push({ das_id: { in: das_ids } });
    }

    return this.prisma.m_device.count({
      where: whereClause,
    });
  }

  async findDeviceByNameAndInstansiId(name: string, instansi_id: number) {
    return this.prisma.m_device.findFirst({
      where: {
        name,
        instansi_id,
      },
    });
  }

  async findDeviceById(id: number): Promise<any> {
    return this.prisma.m_device.findUnique({
      where: {
        id,
      },
    });
  }

  async saveModule(request: any & {}): Promise<any> {
    const result = await this.prisma.m_modules.create({
      data: {
        name: request.name,
        instansi_id: request.instansi_id,
        is_active: request.is_active,
        description: request.description,
      },
    });
    return result;
  }

  async updateDevice(id: number, request: any & {}): Promise<any> {
    const result = await this.prisma.m_device.update({
      where: {
        id,
      },
      data: {
        name: request.name,
        updated_at: new Date(),
      },
    });
    return result;
  }

  //delete module
  async deleteModule(id: number): Promise<any> {
    const result = await this.prisma.m_modules.delete({
      where: {
        id,
      },
    });
    return result;
  }

  //find many modules by instansi_ids
  async findModulesByInstansiIds(instansi_ids: number[]): Promise<any[]> {
    return this.prisma.m_modules.findMany({
      where: {
        instansi_id: {
          in: instansi_ids,
        },
      },
    });
  }
}
