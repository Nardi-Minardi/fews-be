import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class CmsUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllUser({
    role_id,
    search,
    limit = 50,
    offset = 0,
    orderBy = 'id',
    orderDirection = 'desc',
    instansi_id,
  }: {
    role_id?: number;
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    instansi_id?: number;
  }) {
    const whereClause: any = {
      AND: [{ OR: [{ is_active: true }, { is_active: null }] }],
    };

    if (role_id) {
      whereClause.AND.push({ role_id });
    }

    if (instansi_id) {
      whereClause.AND.push({ instansi_id });
    }

    if (search) {
      whereClause.AND.push({
        OR: [
          { full_name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // SAFE ORDER CLAUSE
    let orderClause: any = undefined;

    // hanya set jika orderBy valid
    if (orderBy && orderBy.trim() !== '') {
      orderClause = {
        [orderBy]: orderDirection ?? 'asc',
      };
    }

    return this.prisma.m_users.findMany({
      where: whereClause,
      orderBy: orderClause,
      include: { m_roles: true, m_jabatan: true, m_instansi: true },
      take: limit,
      skip: offset,
    });
  }

  async countAllUser({
    role_id,
    search,
  }: {
    role_id?: number;
    search?: string;
  }) {
    const whereClause: any = {
      AND: [{ OR: [{ is_active: true }, { is_active: null }] }],
    };

    if (role_id) {
      whereClause.AND.push({ role_id });
    }

    if (search) {
      whereClause.AND.push({
        OR: [
          { full_name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    return this.prisma.m_users.count({
      where: whereClause,
    });
  }

  async findByUsername(username: string) {
    return this.prisma.m_users.findUnique({
      where: { username },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.m_users.findUnique({
      where: { email },
    });
  }

  //find by id
  async findUserById(id: number) {
    return this.prisma.m_users.findUnique({
      where: { id },
      include: { m_roles: true, m_jabatan: true, m_instansi: true },
    });
  }

  async saveUser(request: any & {}): Promise<any> {
    return this.prisma.m_users.create({
      data: request,
      include: { m_roles: true, m_jabatan: true, m_instansi: true },
    });
  }

  async updateUser(id: number, request: any & {}): Promise<any> {
    const result = await this.prisma.m_users.update({
      where: {
        id,
      },
      data: {
        ...request,
      },
      include: { m_roles: true, m_jabatan: true, m_instansi: true },
    });
    return result;
  }

  async deleteUser(id: number): Promise<any> {
    return this.prisma.m_users.delete({
      where: { id },
    });
  }
}
