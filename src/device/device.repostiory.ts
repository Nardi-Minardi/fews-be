import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';

export type DeviceType = 'AWLR' | 'ARR' | 'AWS';

@Injectable()
export class DeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get device_tag_id (id from m_device_tag) by device type enum.
   * Returns null if not found.
   */
  async getTagIdByType(type: DeviceType): Promise<number | null> {
    const tag = await this.prisma.m_device_tag.findUnique({
      where: { name: type },
      select: { id: true },
    });
    return tag?.id ?? null;
  }

  /**
   * Get multiple tag ids by types.
   */
  async getTagIdsByTypes(types: DeviceType[]): Promise<number[]> {
    if (!types?.length) return [];
    const rows = await this.prisma.m_device_tag.findMany({
      where: { name: { in: types } },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => r.id);
  }
}
