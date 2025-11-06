import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class DasRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find DAS ID containing the given point (lat, long).
   * Returns the first matching m_das.id or null if none.
   */
  async findDasIdByPoint(lat: number, long: number): Promise<number | null> {
    if (
      lat === undefined ||
      lat === null ||
      long === undefined ||
      long === null ||
      Number.isNaN(Number(lat)) ||
      Number.isNaN(Number(long))
    ) {
      return null;
    }

    // Prefer strict containment, then covers; as last resort, choose among the 5 nearest within 5km by majority kab/kota then nearest distance.
    const rows: Array<{
      id: number;
      provinsi_code: string | null;
      kab_kota_code: string | null;
      kecamatan_code: string | null;
      kel_des_code: string | null;
    }> = await this.prisma.$queryRaw`
      WITH pt AS (
        SELECT ST_SetSRID(ST_MakePoint(${long}, ${lat}), 4326) AS g
      ), contains AS (
        SELECT 
          d.id,
          d.provinsi_code,
          d.kab_kota_code,
          d.kecamatan_code,
          d.kel_des_code
        FROM m_das d, pt
        WHERE d.geom IS NOT NULL
          AND ST_ContainsProperly(ST_MakeValid(d.geom), pt.g)
        ORDER BY ST_Area(d.geom::geography) ASC
        LIMIT 1
      ), covers AS (
        SELECT 
          d.id,
          d.provinsi_code,
          d.kab_kota_code,
          d.kecamatan_code,
          d.kel_des_code
        FROM m_das d, pt
        WHERE d.geom IS NOT NULL
          AND ST_Covers(ST_MakeValid(d.geom), pt.g)
        ORDER BY ST_Area(d.geom::geography) ASC
        LIMIT 1
      ), near_candidates AS (
        SELECT 
          d.id,
          d.provinsi_code,
          d.kab_kota_code,
          d.kecamatan_code,
          d.kel_des_code,
          ST_Distance(d.geom::geography, pt.g::geography) AS dist_m
        FROM m_das d, pt
        WHERE d.geom IS NOT NULL
          AND ST_DWithin(d.geom::geography, pt.g::geography, 5000)
        ORDER BY dist_m ASC
        LIMIT 5
      ), mode_kab AS (
        SELECT kab_kota_code
        FROM near_candidates
        GROUP BY kab_kota_code
        ORDER BY COUNT(*) DESC, MIN(dist_m) ASC
        LIMIT 1
      ), near_pick AS (
        SELECT 
          nc.id,
          nc.provinsi_code,
          nc.kab_kota_code,
          nc.kecamatan_code,
          nc.kel_des_code
        FROM near_candidates nc, mode_kab mk
        ORDER BY (nc.kab_kota_code = mk.kab_kota_code) DESC, nc.dist_m ASC
        LIMIT 1
      )
      SELECT * FROM contains
      UNION ALL
      SELECT * FROM covers WHERE NOT EXISTS (SELECT 1 FROM contains)
      UNION ALL
      SELECT * FROM near_pick WHERE NOT EXISTS (SELECT 1 FROM contains) AND NOT EXISTS (SELECT 1 FROM covers)
      LIMIT 1;
    `;

    return rows[0]?.id ?? null;
  }

  /**
   * Detailed lookup: returns DAS id and associated region codes for kab/kota, kecamatan, and kel/des.
   */
  async findDasByPointDetailed(
    lat: number,
    long: number,
  ): Promise<{
    id: number;
    kab_kota_code: string | null;
    kecamatan_code: string | null;
    kel_des_code: string | null;
  } | null> {
    if (
      lat === undefined ||
      lat === null ||
      long === undefined ||
      long === null ||
      Number.isNaN(Number(lat)) ||
      Number.isNaN(Number(long))
    ) {
      return null;
    }

    const rows: Array<{ id: number }> = await this.prisma.$queryRaw`
			WITH pt AS (
				SELECT ST_SetSRID(ST_MakePoint(${long}, ${lat}), 4326) AS g
			), contains AS (
				SELECT d.id
				FROM m_das d, pt
				WHERE d.geom IS NOT NULL AND ST_ContainsProperly(ST_MakeValid(d.geom), pt.g)
				ORDER BY ST_Area(d.geom::geography) ASC
				LIMIT 1
			), covers AS (
				SELECT d.id
				FROM m_das d, pt
				WHERE d.geom IS NOT NULL AND ST_Covers(ST_MakeValid(d.geom), pt.g)
				ORDER BY ST_Area(d.geom::geography) ASC
				LIMIT 1
			), near_candidates AS (
				SELECT d.id, d.kab_kota_code, ST_Distance(d.geom::geography, pt.g::geography) AS dist_m
				FROM m_das d, pt
				WHERE d.geom IS NOT NULL AND ST_DWithin(d.geom::geography, pt.g::geography, 5000)
				ORDER BY dist_m ASC
				LIMIT 5
			), mode_kab AS (
				SELECT kab_kota_code
				FROM near_candidates
				GROUP BY kab_kota_code
				ORDER BY COUNT(*) DESC, MIN(dist_m) ASC
				LIMIT 1
			), near_pick AS (
				SELECT nc.id
				FROM near_candidates nc, mode_kab mk
				ORDER BY (nc.kab_kota_code = mk.kab_kota_code) DESC, nc.dist_m ASC
				LIMIT 1
			), pick AS (
				SELECT id FROM contains
				UNION ALL
				SELECT id FROM covers WHERE NOT EXISTS (SELECT 1 FROM contains)
				UNION ALL
				SELECT id FROM near_pick WHERE NOT EXISTS (SELECT 1 FROM contains) AND NOT EXISTS (SELECT 1 FROM covers)
				LIMIT 1
			)
			SELECT d.id, d.kab_kota_code, d.kecamatan_code, d.kel_des_code
			FROM m_das d
			JOIN pick p ON p.id = d.id
		`;

    if (!rows[0]) return null;
    const { id } = rows[0] as any;
    // Use a typed select to fetch codes cleanly
    const detail = await this.prisma.m_das.findUnique({
      where: { id: id as number },
      select: {
        id: true,
        kab_kota_code: true,
        kecamatan_code: true,
        kel_des_code: true,
      },
    });
    return detail ?? null;
  }
}
