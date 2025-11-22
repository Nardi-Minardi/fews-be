import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class CmsMenuRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllMenu({
    module_ids,
    search,
    limit = 50,
    offset = 0,
  }: {
    module_ids?: number[];
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const whereClause: any = {
      AND: [{ OR: [{ is_active: true }] }],
    };

    if (search) {
      whereClause.AND.push({
        OR: [{ title: { contains: search, mode: 'insensitive' } }],
      });
    }

    if (module_ids && module_ids.length > 0) {
      whereClause.AND.push({ module_id: { in: module_ids } });
    }

    return this.prisma.m_menus.findMany({
      where: whereClause,
      include: {
        m_modules: {
          select: {
            name: true, 
          },
        },
      },
      take: limit,
      skip: offset,
    });
  }

  async countAllMenu({
    module_ids,
    search,
  }: {
    module_ids?: number[];
    search?: string;
  }) {
    const whereClause: any = {
      AND: [{ OR: [{ is_active: true }] }],
    };

    if (search) {
      whereClause.AND.push({
        OR: [{ title: { contains: search, mode: 'insensitive' } }],
      });
    }

    if (module_ids && module_ids.length > 0) {
      whereClause.AND.push({ module_id: { in: module_ids } });
    }

    return this.prisma.m_menus.count({
      where: whereClause,
    });
  }

  //find Menu by id
  async findMenuById(id: number): Promise<any> {
    return this.prisma.m_menus.findUnique({
      where: {
        id,
      },
    });
  }

  async saveMenu(request: any & {}): Promise<any> {
    const result = await this.prisma.m_menus.create({
      data: {
        title: request.title,
        module_id: request.module_id,
        value: request.value,
        path: request.path,
      },
    });
    return result;
  }

  //update Menu
  async updateMenu(id: number, request: any & {}): Promise<any> {
    const result = await this.prisma.m_menus.update({
      where: {
        id,
      },
      data: {
        title: request.title,
        module_id: request.module_id,
        value: request.value,
        path: request.path,
      },
    });
    return result;
  }

  //delete Menu
  async deleteMenu(id: number): Promise<any> {
    const result = await this.prisma.m_menus.delete({
      where: {
        id,
      },
    });
    return result;
  }

  async findMenuByTitleAndModuleId(title: string, module_id: number) {
    return this.prisma.m_menus.findFirst({
      where: {
        title,
        module_id,
      },
    });
  }

  //assign menu to user with permissions
  async doAssignMenuToUser(request: any): Promise<any> {
    const result = await this.prisma.m_menu_permissions.upsert({
      where: {
        menu_id_user_id: {
          menu_id: request.menu_id,
          user_id: request.user_id,
        },
      },
      create: {
        menu_id: request.menu_id,
        user_id: request.user_id,
        menu_name: request.menu_name,
        permissions: request.permissions,
      },
      update: {
        permissions: request.permissions,
        updated_at: new Date(),
      },
    });

    return result;
  }

  //cek menu tersebut punya module yang sama dengan user dengan instansi yang sama
  async checkMenuModule(menu_id: number, user_id: number): Promise<any> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT m_menus.*, m_modules.name as module_name, m_modules.instansi_id
      FROM m_menus
      LEFT JOIN m_modules ON m_menus.module_id = m_modules.id
      LEFT JOIN m_instansi ON m_modules.instansi_id = m_instansi.id
      WHERE m_menus.id = ${menu_id}
      AND m_instansi.id = (
        SELECT instansi_id FROM m_users WHERE id = ${user_id}
      )
    `;
    return result[0];
  }
}
