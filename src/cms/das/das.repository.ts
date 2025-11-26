import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class CmsDasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllDas({
    search,
    limit = 50,
    offset = 0,
    orderBy = 'id',
    orderDirection = 'desc',
    instansi_id,
  }: {
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    instansi_id?: number;
  }) {
    const allowedOrderBy = ['id', 'name', 'created_at', 'updated_at'];
    const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'id';
    const safeDirection = orderDirection === 'asc' ? 'asc' : 'desc';

    const params: any[] = [];

    let where = `WHERE m_das.name ILIKE $${params.length + 1}`;
    params.push(search ? `%${search}%` : `%`);

    if (instansi_id) {
      where += ` AND m_device.instansi_id = $${params.length + 1}`;
      params.push(instansi_id);
    }

    params.push(limit);
    params.push(offset);

    const query = `
      SELECT DISTINCT ON (m_das.id)
        m_das.id,
        m_das.name,
        ST_AsGeoJSON(m_das.geom) AS geom,
        m_das.created_at,
        m_das.updated_at,
        m_device.instansi_id
      FROM m_das
      LEFT JOIN m_device ON m_das.id = m_device.das_id
      ${where}
      ORDER BY m_das.id, ${safeOrderBy} ${safeDirection}
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
    `;

    return await this.prisma.$queryRawUnsafe<any[]>(query, ...params);
  }

  async countAllDas({
    search,
    instansi_id,
  }: {
    search?: string;
    instansi_id?: number;
  }) {
    const params: any[] = [];

    let where = `WHERE m_das.name ILIKE $${params.length + 1}`;
    params.push(search ? `%${search}%` : `%`);

    if (instansi_id) {
      where += ` AND m_device.instansi_id = $${params.length + 1}`;
      params.push(instansi_id);
    }

    const query = `
      SELECT COUNT(DISTINCT m_das.id) AS total
      FROM m_das
      LEFT JOIN m_device ON m_das.id = m_device.das_id
      ${where}
    `;

    const result = await this.prisma.$queryRawUnsafe<any[]>(query, ...params);
    return Number(result[0]?.total || 0);
  }
}
