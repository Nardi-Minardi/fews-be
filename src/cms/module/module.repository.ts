import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';


@Injectable()
export class CmsModuleRepository {
  constructor(
    private readonly prisma: PrismaService,
   
  ) {}

  async findAllModule({
    instansi_id,
    search,
    limit = 50,
    offset = 0,
  }: {
    instansi_id?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }) {

    const whereClause: any = {
      AND: [{ OR: [{ is_active: true }] }],
    };

    if (instansi_id) {
      whereClause.AND.push({ instansi_id });
    }

    if (search) {
      whereClause.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    return this.prisma.m_modules.findMany({
      where: whereClause,
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

  async countAllModule({
    instansi_id,
    search,
  }: {
    instansi_id?: number;
    search?: string;
  }) {
    const whereClause: any = {
      AND: [{ OR: [{ is_active: true }] }],
    };

    if (instansi_id) {
      whereClause.AND.push({ instansi_id });
    }

    if (search) {
      whereClause.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    return this.prisma.m_modules.count({
      where: whereClause,
    });
  }

  //find module with name and instansi_id yang sama
  async findModuleByNameAndInstansiId(name: string, instansi_id: number) {
    return this.prisma.m_modules.findFirst({
      where: {
        name,
        instansi_id,
      },
    });
  }

  //find module by id
  async findModuleById(id: number): Promise<any> {
    return this.prisma.m_modules.findUnique({
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

  //update module
  async updateModule(id: number, request: any & {}): Promise<any> {
    const result = await this.prisma.m_modules.update({
      where: {
        id,
      },
      data: {
        name: request.name,
        is_active: request.is_active,
        description: request.description,
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
