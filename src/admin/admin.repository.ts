import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MasterPrismaService, PrismaService } from 'src/common/prisma.service';
import {
  Prisma,
  status_upload_ii,
  verifikasi_enum,
} from '.prisma/main-client/client';
import { SuratRepository } from 'src/surat/surat.repository';
import { DaftarVerifikasiPaginationDto } from './dto/get.admin.dto';
import { suratAllowedFields } from 'src/common/constants/surat.fields';
@Injectable()
export class AdminRepository {
  constructor(
    private readonly masterPrismaService: MasterPrismaService,
    private readonly prismaService: PrismaService,
  ) {}

  async countDaftarVerifikasi(
    search: string | undefined,
    userId: number | null,
  ): Promise<number> {
    //base status = true
    const where: any = {
      status: true,
    };

    // filter userId hanya kalau ada
    if (userId) {
      where.created_by = userId;
    }

    // filter search hanya kalau ada
    if (search) {
      where.OR = [
        { no_surat: { contains: search, mode: 'insensitive' } },
        { perihal: { contains: search, mode: 'insensitive' } },
        { nama_pengusul: { contains: search, mode: 'insensitive' } },
        { jabatan_pengusul: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prismaService.ppnsSurat.count({ where });
  }

  async findAllWithDaftarVerifikasi(
    search: string | undefined,
    page: number,
    limit: number,
    orderBy: string | undefined = 'id',
    orderDirection: 'asc' | 'desc' = 'desc',
    filters?: Array<{ field: string; value: string }>,
    userId?: number | null,
  ): Promise<any[]> {
    // validasi orderBy agar tidak SQL injection
    if (!suratAllowedFields.includes(orderBy)) {
      throw new BadRequestException(
        `Field orderBy '${orderBy}' tidak valid. Gunakan salah satu: ${suratAllowedFields.join(', ')}`,
      );
    }

    const where: any = {
      status: true,
    };

    if (userId != null) {
      where.created_by = Number(userId);
    }

    // --- global search ---
    if (search) {
      const orConditions: any[] = [];

      // cari di kolom string
      orConditions.push(
        { no_surat: { contains: search, mode: 'insensitive' } },
        { perihal: { contains: search, mode: 'insensitive' } },
        { nama_pengusul: { contains: search, mode: 'insensitive' } },
        { jabatan_pengusul: { contains: search, mode: 'insensitive' } },
      );

      // date search
      const parsedDate = new Date(search);
      if (!isNaN(parsedDate.getTime())) {
        orConditions.push({ tgl_surat: parsedDate });
      }

      where.OR = orConditions;
    }

    // --- filters ---
    if (filters && filters.length > 0) {
      const numberFields = ['lembaga_kementerian', 'instatnsi'];
      const stringFields = ['nama_pengusul', 'jabatan_pengusul', 'no_surat'];
      const enumFields = ['status'];

      const filterConditions: any[] = [];

      for (const filter of filters) {
        const { field, value } = filter;

        // number
        if (numberFields.includes(field) && !isNaN(Number(value))) {
          filterConditions.push({ [field]: Number(value) });
          continue;
        }

        // string
        if (stringFields.includes(field) && typeof value === 'string') {
          filterConditions.push({
            [field]: { contains: value, mode: 'insensitive' },
          });
          continue;
        }

        // enum: konversi label ke enum internal
        if (enumFields.includes(field)) {
          let enumValue: string | undefined;
          if (field === 'status') {
            if (value === 'true' || value === '1') enumValue = 'true';
            else if (value === 'false' || value === '0') enumValue = 'false';
          }

          if (enumValue) {
            filterConditions.push({ [field]: enumValue });
          } else {
            throw new BadRequestException(
              `Nilai filter untuk ${field} tidak valid: ${value}`,
            );
          }
        }
      }

      if (filterConditions.length > 0) {
        where.AND = filterConditions; // AND supaya semua filter cocok
      }
    }

    // --- eksekusi query ---
    const results = await this.prismaService.ppnsSurat.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [orderBy]: orderDirection },
      include: {
        ppns_kementerian: true,
        ppns_instansi: true,
        ppns_layanan: true,
        ppns_data_pns: true,
      },
    });

    const mappedResults: any[] = [];
    for (const item of results) {
      mappedResults.push({
        ...item,
        count_calon_ppns: item.ppns_data_pns.length,
      });
    }

    return mappedResults;
  }

  async countPpnsDataPnsByIdSurat(id_surat: number): Promise<number> {
    return this.prismaService.ppnsDataPns.count({
      where: { id_surat },
    });
  }

  async findPpnsDataPnsByIdSurat(
    id_surat: number,
    limit?: number,
    offset?: number,
  ) {
    if (!id_surat) {
      throw new BadRequestException('id_surat is required');
    }

    const item = await this.prismaService.ppnsDataPns.findMany({
      where: { id_surat },
      skip: offset,
      take: limit,
      include: {
        ppns_surat: true,
        ppns_wilayah_kerja: true,
        ppns_mutasi: true,
        ppns_pelantikan: true,
        ppns_pemberhentian_nto: true,
        ppns_pemberhentian_pensiun: true,
        ppns_pemberhentian_undur_diri: true,
        ppns_penerbitan_ktp: true,
        ppns_pengangkatan: true,
        ppns_pengangkatan_kembali: true,
        ppns_perpanjang_ktp: true,
        ppns_upload: true,
        ppns_verifikasi_ppns: true,
        data_verifikasi_admin: true,
      },
    });

    const mappedItem: any[] = [];

    for (const calon of item) {
      // ambil data referensi agama & pangkat
      const dataAgama = await this.masterPrismaService.agama.findFirst({
        where: { id_agama: calon.agama || undefined },
      });

      const dataPangkatGolongan =
        await this.prismaService.ppnsPangkatGolongan.findFirst({
          where: {
            id: calon.pangkat_golongan
              ? Number(calon.pangkat_golongan)
              : undefined,
          },
        });

      // Default step_history dan current_step
      let steps: Array<any> = [];
      let currentStep: any = null;

      // ======= Build Step-by-Step Verification History =======
      if (calon.data_verifikasi_admin) {
        // Step 1: Verifikasi Identitas
        const verifDataStatus =
          calon.data_verifikasi_admin?.verifikasi_data ?? null;
        steps.push({
          key: 'verifikasi_identitas',
          name_step: 'Verifikasi Identitas',
          status: verifDataStatus,
          color: this.getColorForStatus(verifDataStatus),
          at: calon.data_verifikasi_admin?.verifikator_at ?? null,
          by: calon.data_verifikasi_admin?.verifikator_by ?? null,
        });

        // Step 2: Verifikasi Wilayah Kerja
        const verifWilayahStatus =
          calon.data_verifikasi_admin?.verifikasi_wilayah ?? null;
        steps.push({
          key: 'verifikasi_wilayah',
          name_step: 'Verifikasi Wilayah Kerja',
          status: verifWilayahStatus,
          color: this.getColorForStatus(verifWilayahStatus),
          at: calon.data_verifikasi_admin?.verifikator_at ?? null,
          by: calon.data_verifikasi_admin?.verifikator_by ?? null,
        });

        // Step 3: Verifikasi Masa Kerja
        const verifMasaKerjaStatus =
          calon.data_verifikasi_admin?.verifikasi_masa_kerja ?? null;
        steps.push({
          key: 'verifikasi_masa_kerja',
          name_step: 'Verifikasi Masa Kerja',
          status: verifMasaKerjaStatus,
          color: this.getColorForStatus(verifMasaKerjaStatus),
          at: calon.data_verifikasi_admin?.verifikator_at ?? null,
          by: calon.data_verifikasi_admin?.verifikator_by ?? null,
        });

        // Step 4: Verifikasi Pendidikan Terakhir
        const verifPendidikanTerakhirStatus =
          calon.data_verifikasi_admin?.verifikasi_pendidikan_terakhir ?? null;
        steps.push({
          key: 'verifikasi_pendidikan_terakhir',
          name_step: 'Verifikasi Pendidikan Terakhir',
          status: verifMasaKerjaStatus,
          color: this.getColorForStatus(verifPendidikanTerakhirStatus),
          at: calon.data_verifikasi_admin?.verifikator_at ?? null,
          by: calon.data_verifikasi_admin?.verifikator_by ?? null,
        });

        // Step 5: Verifikasi Teknis Operasional
        const verifTeknisOperasionalStatus =
          calon.data_verifikasi_admin?.verifikasi_teknis_operasional ?? null;
        steps.push({
          key: 'verifikasi_teknis_operasional',
          name_step: 'Verifikasi Teknis Operasional',
          status: verifTeknisOperasionalStatus,
          color: this.getColorForStatus(verifTeknisOperasionalStatus),
          at: calon.data_verifikasi_admin?.verifikator_at ?? null,
          by: calon.data_verifikasi_admin?.verifikator_by ?? null,
        });

        // Step 5: Verifikasi Surat Sehat
        const verifSuratSehatStatus =
          calon.data_verifikasi_admin?.verifikasi_surat_sehat ?? null;
        steps.push({
          key: 'verifikasi_surat_sehat',
          name_step: 'Verifikasi Surat Sehat',
          status: verifSuratSehatStatus,
          color: this.getColorForStatus(verifSuratSehatStatus),
          at: calon.data_verifikasi_admin?.verifikator_at ?? null,
          by: calon.data_verifikasi_admin?.verifikator_by ?? null,
        });

        // Step 5: Verifikasi Verifikasi DP3
        const verifDp3Status =
          calon.data_verifikasi_admin?.verifikasi_verifikasi_dp3 ?? null;
        steps.push({
          key: 'verifikasi_verifikasi_dp3',
          name_step: 'Verifikasi Surat Sehat',
          status: verifDp3Status,
          color: this.getColorForStatus(verifDp3Status),
          at: calon.data_verifikasi_admin?.verifikator_at ?? null,
          by: calon.data_verifikasi_admin?.verifikator_by ?? null,
        });

        // Tentukan current step terakhir (status bukan pending)
        currentStep =
          steps
            .slice()
            .reverse()
            .find((s) => {
              const st = s.status ? String(s.status).toLowerCase() : '';
              return st === 'sesuai' || st === 'tolak' || st === 'tidaksesuai';
            }) ?? null;
      }

      // ======= Push ke hasil akhir =======
      mappedItem.push({
        ...calon,
        data_agama: dataAgama || null,
        data_pangkat_golongan: dataPangkatGolongan || null,
        status_kirim_verifikator: item[0]?.ppns_surat?.status ?? false,
        status_data: calon.data_verifikasi_admin
          ? calon.data_verifikasi_admin.status
          : null,
        step_history: steps, // kalau tidak ada data_verifikasi_admin → []
        current_step: currentStep, // kalau tidak ada → null
        ppns_wilayah_kerja: calon.ppns_wilayah_kerja.map((wilayah) => ({
          id: wilayah.id || null,
          id_ppns: wilayah.id_ppns || null,
          id_surat: wilayah.id_surat || null,
          uu_dikawal: [
            wilayah.uu_dikawal_1,
            wilayah.uu_dikawal_2,
            wilayah.uu_dikawal_3,
          ].filter((uu): uu is string => !!uu),
        })),
      });
    }

    return mappedItem;
  }

  private getColorForStatus(status?: string | null): string {
    if (!status) return 'gray';
    const lower = status.toLowerCase();
    if (lower === 'sesuai') return 'green';
    if (lower === 'tolak' || lower === 'tidaksesuai') return 'red';
    return 'gray';
  }
}
