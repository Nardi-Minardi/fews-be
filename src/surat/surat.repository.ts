import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MasterPrismaService, PrismaService } from 'src/common/prisma.service';
import { Prisma, status_upload_ii } from '.prisma/main-client/client';
import { PpnsSurat } from '.prisma/main-client/client';
import { suratAllowedFields } from 'src/common/constants/surat.fields';
import { GetSuratPaginationDto, SuratPaginationDto } from './dto/get.surat.dto';
import { CreateResponsePpnsDataPnsDto } from './dto/create.surat.dto';
import { LayananRepository } from 'src/layanan/layanan.repository';

@Injectable()
export class SuratRepository {
  constructor(
    private readonly masterPrismaService: MasterPrismaService,
    private readonly prismaService: PrismaService,
    private readonly layananRepository: LayananRepository,
  ) {}

  async countSurat(
    layanan: string | undefined,
    search: string | undefined,
    userId: number | null,
  ): Promise<number> {
    let dataLayanan: any;
    const where: any = {}; // kita isi di bawah

    switch (layanan) {
      case 'verifikasi':
        dataLayanan =
          await this.layananRepository.findLayananByNama('verifikasi');
        where.id_layanan = dataLayanan?.id ?? 1; // fallback kalau null
        break;

      case 'pengangkatan':
        dataLayanan =
          await this.layananRepository.findLayananByNama('pengangkatan');
        where.id_layanan = dataLayanan?.id ?? 2;
        break;

      case 'pelantikan':
        dataLayanan =
          await this.layananRepository.findLayananByNama('pelantikan');
        where.id_layanan = dataLayanan?.id ?? 3;
        break;

      case 'mutasi':
        dataLayanan = await this.layananRepository.findLayananByNama('mutasi');
        where.id_layanan = dataLayanan?.id ?? 4;
        break;

      case 'pengangkatan kembali':
        dataLayanan = await this.layananRepository.findLayananByNama(
          'pengangkatan_kembali',
        );
        where.id_layanan = dataLayanan?.id ?? 5;
        break;

      case 'perpanjang ktp':
        dataLayanan =
          await this.layananRepository.findLayananByNama('perpanjang ktp');
        where.id_layanan = dataLayanan?.id ?? 6;
        break;

      case 'penerbitan kembali ktp':
        dataLayanan = await this.layananRepository.findLayananByNama(
          'penerbitan kembali ktp',
        );
        where.id_layanan = dataLayanan?.id ?? 7;
        break;

      case 'undur diri':
        dataLayanan =
          await this.layananRepository.findLayananByNama('undur diri');
        where.id_layanan = dataLayanan?.id ?? 8;
        break;

      case 'pensiun':
        dataLayanan = await this.layananRepository.findLayananByNama('pensiun');
        where.id_layanan = dataLayanan?.id ?? 9;
        break;

      case 'pemberhentian NTO':
        dataLayanan =
          await this.layananRepository.findLayananByNama('pemberhentian NTO');
        where.id_layanan = dataLayanan?.id ?? 10;
        break;

      default:
        throw new BadRequestException(`Layanan '${layanan}' tidak dikenali`);
    }

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

  async findAllWithPaginationSurat(
    layanan: string | undefined,
    search: string | undefined,
    page: number,
    limit: number,
    orderBy: string | undefined = 'id',
    orderDirection: 'asc' | 'desc' = 'desc',
    filters?: Array<{ field: string; value: string }>,
    userId?: number | null,
  ): Promise<SuratPaginationDto[]> {
    // validasi orderBy agar tidak SQL injection
    if (!suratAllowedFields.includes(orderBy)) {
      throw new BadRequestException(
        `Field orderBy '${orderBy}' tidak valid. Gunakan salah satu: ${suratAllowedFields.join(', ')}`,
      );
    }

    const where: any = {}; // kita isi di bawah
    let dataLayanan: any;

    switch (layanan) {
      case 'verifikasi':
        dataLayanan =
          await this.layananRepository.findLayananByNama('verifikasi');
        where.id_layanan = dataLayanan?.id ?? 1; // fallback kalau null
        break;

      case 'pengangkatan':
        dataLayanan =
          await this.layananRepository.findLayananByNama('pengangkatan');
        where.id_layanan = dataLayanan?.id ?? 2;
        break;

      case 'pelantikan':
        dataLayanan =
          await this.layananRepository.findLayananByNama('pelantikan');
        where.id_layanan = dataLayanan?.id ?? 3;
        break;

      case 'mutasi':
        dataLayanan = await this.layananRepository.findLayananByNama('mutasi');
        where.id_layanan = dataLayanan?.id ?? 4;
        break;

      case 'pengangkatan kembali':
        dataLayanan = await this.layananRepository.findLayananByNama(
          'pengangkatan_kembali',
        );
        where.id_layanan = dataLayanan?.id ?? 5;
        break;

      case 'perpanjang ktp':
        dataLayanan =
          await this.layananRepository.findLayananByNama('perpanjang ktp');
        where.id_layanan = dataLayanan?.id ?? 6;
        break;

      case 'penerbitan kembali ktp':
        dataLayanan = await this.layananRepository.findLayananByNama(
          'penerbitan kembali ktp',
        );
        where.id_layanan = dataLayanan?.id ?? 7;
        break;

      case 'undur diri':
        dataLayanan =
          await this.layananRepository.findLayananByNama('undur diri');
        where.id_layanan = dataLayanan?.id ?? 8;
        break;

      case 'pensiun':
        dataLayanan = await this.layananRepository.findLayananByNama('pensiun');
        where.id_layanan = dataLayanan?.id ?? 9;
        break;

      case 'pemberhentian NTO':
        dataLayanan =
          await this.layananRepository.findLayananByNama('pemberhentian NTO');
        where.id_layanan = dataLayanan?.id ?? 10;
        break;

      default:
        throw new BadRequestException(`Layanan '${layanan}' tidak dikenali`);
    }

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
      },
    });

    // mapping hasil
    return results.map((item) => ({
      ...item,
      page: String(page),
      limit: String(limit),
    }));
  }

  async saveSurat(data: Prisma.PpnsSuratCreateInput): Promise<PpnsSurat> {
    return this.prismaService.ppnsSurat.create({
      data: {
        ...data,
      },
    });
  }

  async findPpnSuratById(id: number): Promise<Prisma.PpnsSuratGetPayload<{
    include: { ppns_data_pns: true; ppns_upload: true };
  }> | null> {
    return this.prismaService.ppnsSurat.findFirst({
      where: { id },
      include: {
        ppns_data_pns: {
          include: {
            ppns_verifikasi_ppns: true,
            ppns_pelantikan: true,
            ppns_pengangkatan: true,
            ppns_upload: true,
          },
        },
        ppns_upload: true,
      },
    });
  }

  async updateStatusPpnsSurat(id: number, status: boolean): Promise<PpnsSurat> {
    await this.prismaService.ppnsSurat.findUnique({
      where: { id },
    });

    return this.prismaService.ppnsSurat.update({
      where: { id },
      data: { status },
    });
  }

  async savePpnsDataPns(
    data: Prisma.PpnsDataPnsCreateInput & {
      provinsi_penempatan?: number;
      kabupaten_penempatan?: number;
      unit_kerja?: string;
      gelar_depan?: string | null;
      created_by: number | null;
      kartu_tanda_penyidik_no_ktp?: string | null;
      kartu_tanda_penyidik_tgl_ktp?: Date | null;
      karta_tanda_penyidik_tgl_berlaku_ktp?: Date | null;
      id_surat: number;
    },
  ): Promise<CreateResponsePpnsDataPnsDto> {
    const {
      provinsi_penempatan,
      kabupaten_penempatan,
      unit_kerja,
      created_by,
      kartu_tanda_penyidik_no_ktp,
      kartu_tanda_penyidik_tgl_ktp,
      karta_tanda_penyidik_tgl_berlaku_ktp,
      ...ppnsData
    } = data;

    // ✅ 1. Cari apakah data sudah ada
    let existing = await this.prismaService.ppnsDataPns.findFirst({
      where: {
        id_surat: data.id_surat,
      },
      include: {
        ppns_wilayah_kerja: true,
        ppns_verifikasi_ppns: true,
      },
    });

    let result;

    if (existing) {
      // 🔥 Hapus dulu semua wilayah kerja lama
      await this.prismaService.wilayahKerja.deleteMany({
        where: { id_ppns: existing.id },
      });

      // ✅ 2. Update jika sudah ada
      // Remove 'ppns_surat' if present, as update does not accept nested create inputs
      const { ppns_surat, ...updateData } = ppnsData as any;
      result = await this.prismaService.ppnsDataPns.update({
        where: { id: existing.id },
        data: updateData,
        include: {
          ppns_wilayah_kerja: true,
          ppns_verifikasi_ppns: true,
        },
      });
      // ✅ Insert ulang wilayah kerja baru kalau ada di input
      if ((ppnsData as any).ppns_wilayah_kerja?.length) {
        await this.prismaService.wilayahKerja.createMany({
          data: (ppnsData as any).ppns_wilayah_kerja.map((w) => ({
            ...w,
            id_ppns: result.id,
          })),
        });

        // refresh result biar return sudah include data terbaru
        result = await this.prismaService.ppnsDataPns.findUnique({
          where: { id: result.id },
          include: { ppns_wilayah_kerja: true, ppns_verifikasi_ppns: true },
        });
      }
    } else {
      // ✅ 3. Create jika belum ada
      result = await this.prismaService.ppnsDataPns.create({
        // Remove 'ppns_surat' if present, as create does not accept nested create inputs
        data: (() => {
          const { ppns_surat, ...rest } = ppnsData as any;
          return rest;
        })(),
        include: {
          ppns_wilayah_kerja: true,
          ppns_verifikasi_ppns: true,
        },
      });

      // ✅ 4. Tambahan create otomatis (hanya saat create pertama)
    }

    const surat = await this.prismaService.ppnsSurat.findUnique({
      where: { id: result.id_surat ?? undefined },
    });

    if (!surat) throw new NotFoundException('Surat not found');

    const layanan = await this.prismaService.ppnsLayanan.findUnique({
      where: { id: surat.id_layanan ?? undefined },
    });

    if (!layanan) throw new NotFoundException('Layanan not found');

    if (layanan.nama === 'verifikasi') {
      const existing = await this.prismaService.ppnsVerifikasiPpns.findUnique({
        where: { id_data_ppns: result.id },
      });

      if (existing) {
        await this.prismaService.ppnsVerifikasiPpns.update({
          where: { id: existing.id }, // pakai id yang pasti unique
          data: {
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
          },
        });
      } else {
        await this.prismaService.ppnsVerifikasiPpns.create({
          data: {
            id_data_ppns: result.id,
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
            created_by,
          },
        });
      }
    } else if (layanan.nama === 'pengangkatan') {
      const existing = await this.prismaService.ppnsPengangkatan.findUnique({
        where: { id_data_ppns: result.id },
      });

      if (existing) {
        await this.prismaService.ppnsPengangkatan.update({
          where: { id: existing.id },
          data: {
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
          },
        });
      } else {
        await this.prismaService.ppnsPengangkatan.create({
          data: {
            id_data_ppns: result.id,
            id_surat: result.id_surat,
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
            created_by,
          },
        });
      }
    } else if (layanan.nama === 'pelantikan') {
      const existing = await this.prismaService.ppnsPelantikan.findUnique({
        where: { id_data_ppns: result.id },
      });

      if (existing) {
        await this.prismaService.ppnsPelantikan.update({
          where: { id: existing.id },
          data: {
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
          },
        });
      } else {
        await this.prismaService.ppnsPelantikan.create({
          data: {
            id_data_ppns: result.id,
            id_surat: result.id_surat,
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
            created_by,
          },
        });
      }
    } else if (layanan.nama === 'mutasi') {
      // untuk mutasi, kita simpan di tabel ppns_verifikasi_ppns juga
      const existing = await this.prismaService.ppnsMutasi.findUnique({
        where: { id_data_ppns: result.id },
      });
      if (existing) {
        await this.prismaService.ppnsMutasi.update({
          where: { id: existing.id },
          data: {
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
          },
        });
      } else {
        await this.prismaService.ppnsMutasi.create({
          data: {
            id_data_ppns: result.id,
            id_surat: result.id_surat,
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
            created_by,
          },
        });
      }
    } else if (layanan.nama === 'pengangkatan kembali') {
      const existing =
        await this.prismaService.ppnsPengangkatanKembali.findUnique({
          where: { id_data_ppns: result.id },
        });

      if (existing) {
        await this.prismaService.ppnsPengangkatanKembali.update({
          where: { id: existing.id },
          data: {
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
          },
        });
      } else {
        await this.prismaService.ppnsPengangkatanKembali.create({
          data: {
            id_data_ppns: result.id,
            id_surat: result.id_surat,
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
            created_by,
          },
        });
      }
    } else if (layanan.nama === 'perpanjang ktp') {
      const existing = await this.prismaService.ppnsPerpanjangKtp.findUnique({
        where: { id_data_ppns: result.id },
      });
      if (existing) {
        await this.prismaService.ppnsPerpanjangKtp.update({
          where: { id: existing.id },
          data: {
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
          },
        });
      } else {
        await this.prismaService.ppnsPerpanjangKtp.create({
          data: {
            id_data_ppns: result.id,
            id_surat: result.id_surat,
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
            created_by,
          },
        });
      }
    } else if (layanan.nama === 'penerbitan kembali ktp') {
      const existing = await this.prismaService.ppnsPenerbitanKembaliKtp.findUnique({
        where: { id_data_ppns: result.id },
      });
      if (existing) {
        await this.prismaService.ppnsPenerbitanKembaliKtp.update({
          where: { id: existing.id },
          data: {
            id_surat: result.id_surat,
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
            no_ktp: kartu_tanda_penyidik_no_ktp,
            tgl_ktp: kartu_tanda_penyidik_tgl_ktp,
            tgl_berlaku_ktp: karta_tanda_penyidik_tgl_berlaku_ktp,
          },
        });
      } else {
        await this.prismaService.ppnsPenerbitanKembaliKtp.create({
          data: {
            id_surat: result.id_surat,
            id_data_ppns: result.id,
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
            created_by,
            no_ktp: kartu_tanda_penyidik_no_ktp,
            tgl_ktp: kartu_tanda_penyidik_tgl_ktp,
            tgl_berlaku_ktp: karta_tanda_penyidik_tgl_berlaku_ktp,
          },
        });
      }
    } else if (layanan.nama === 'pensiun') {
      const existing = await this.prismaService.ppnsPemberhentianPensiun.findUnique({
        where: { id_data_ppns: result.id },
      });
      if (existing) {
        await this.prismaService.ppnsPemberhentianPensiun.update({
          where: { id: existing.id },
          data: {
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
          },
        });
      } else {
        await this.prismaService.ppnsPemberhentianPensiun.create({
          data: {
            id_data_ppns: result.id,
            id_surat: result.id_surat,
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
            created_by,
          },
        });
      }
    } else if (layanan.nama === 'undur diri') {
      const existing = await this.prismaService.ppnsPemberhentianUndurDiri.findUnique({
        where: { id_data_ppns: result.id },
      });
      if (existing) {
        await this.prismaService.ppnsPemberhentianUndurDiri.update({
          where: { id: existing.id },
          data: {
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
          },
        });
      } else {
        await this.prismaService.ppnsPemberhentianUndurDiri.create({
          data: {
            id_data_ppns: result.id,
            id_surat: result.id_surat,
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
            created_by,
          },
        });
      }
    } else if (layanan.nama === 'pemberhentian NTO') {
      const existing = await this.prismaService.ppnsPemberhentianNto.findUnique({
        where: { id_data_ppns: result.id },
      });
      if (existing) {
        await this.prismaService.ppnsPemberhentianNto.update({
          where: { id: existing.id },
          data: {
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
          },
        });
      } else {
        await this.prismaService.ppnsPemberhentianNto.create({
          data: {
            id_data_ppns: result.id,
            provinsi_penempatan,
            kabupaten_penempatan,
            unit_kerja,
            created_by,
          },
        });
      }
    }
    

    // ✅ 5. Mapping response tetap sama
    const identitasPns = {
      nama: result.nama,
      nip: result.nip,
      // nama_gelar: result.nama_gelar,
      jabatan: result.jabatan,
      pangkat_golongan: result.pangkat_golongan,
      jenis_kelamin: result.jenis_kelamin,
      gelar_depan: (data as any).gelar_depan || null,
      agama: result.agama,
      nama_sekolah: result.nama_sekolah,
      gelar_terakhir: result.gelar_terakhir,
      no_ijazah: result.no_ijazah,
      tgl_ijazah: result.tgl_ijazah
        ? result.tgl_ijazah.toISOString().split('T')[0]
        : null,
      tahun_lulus: result.tahun_lulus,
    };

    const lokasiPenempatan = {
      provinsi_penempatan,
      kabupaten_penempatan,
      unit_kerja,
    };

    const wilayahKerja = result.ppns_wilayah_kerja.map((w) => ({
      penempatan_baru: w.penempatan_baru,
      uu_dikawal: [w.uu_dikawal_1, w.uu_dikawal_2, w.uu_dikawal_3].filter(
        (u): u is string => !!u,
      ),
    }));

    const kartuTandaPenyidik = {
      no_ktp: kartu_tanda_penyidik_no_ktp || null,
      tgl_ktp: kartu_tanda_penyidik_tgl_ktp
        ? kartu_tanda_penyidik_tgl_ktp.toISOString().split('T')[0]
        : null,
      tgl_berlaku_ktp: karta_tanda_penyidik_tgl_berlaku_ktp
        ? karta_tanda_penyidik_tgl_berlaku_ktp.toISOString().split('T')[0]
        : null,
    };

    return {
      id: result.id,
      id_surat: result.id_surat,
      identitas_pns: identitasPns,
      wilayah_kerja: wilayahKerja,
      lokasi_penempatan: lokasiPenempatan,
      kartu_tanda_penyidik: kartuTandaPenyidik,
    };
  }

  async findPpnsDataPnsByIdSurat(id_surat: number) {
    return this.prismaService.ppnsDataPns.findMany({
      where: { id_surat },
      include: {
        ppns_wilayah_kerja: true,
        ppns_surat: true,
      },
    });
  }

  async findPpnsDataPnsById(id: number) {
    return this.prismaService.ppnsDataPns.findFirst({
      where: { id },
      include: {
        ppns_wilayah_kerja: true,
      },
    });
  }

  async findPpnsDataPnsByNip(nip: string) {
    return this.prismaService.ppnsDataPns.findFirst({
      where: { nip },
      include: {
        ppns_wilayah_kerja: true,
      },
    });
  }

  async updatePpnsDataPns(
    id: number,
    data: Prisma.PpnsDataPnsUpdateInput,
  ): Promise<CreateResponsePpnsDataPnsDto> {
    const result = await this.prismaService.ppnsDataPns.update({
      where: { id },
      data,
      include: {
        ppns_wilayah_kerja: true,
      },
    });

    // Mapping identitas_pns
    const identitasPns = {
      nama: result.nama,
      nip: result.nip,
      nama_gelar: result.nama_gelar,
      jabatan: result.jabatan,
      pangkat_golongan: result.pangkat_golongan,
      jenis_kelamin: result.jenis_kelamin,
      gelar_depan: (data as any).gelar_depan || null,
      agama: result.agama,
      nama_sekolah: result.nama_sekolah,
      gelar_terakhir: result.gelar_terakhir,
      no_ijazah: result.no_ijazah,
      tgl_ijazah: result.tgl_ijazah
        ? result.tgl_ijazah.toISOString().split('T')[0]
        : null,
      tahun_lulus: result.tahun_lulus,
    };

    // Mapping identitas_pns
    const lokasiPenempatan = {
      provinsi_penempatan: (data as any).provinsi_penempatan,
      kabupaten_penempatan: (data as any).kabupaten_penempatan,
      unit_kerja: (data as any).unit_kerja,
    };

    // Mapping wilayah kerja
    const wilayahKerja = result.ppns_wilayah_kerja.map((w) => ({
      penempatan_baru: w.penempatan_baru,
      uu_dikawal: [w.uu_dikawal_1, w.uu_dikawal_2, w.uu_dikawal_3].filter(
        (u): u is string => !!u,
      ),
    }));

    const kartuTandaPenyidik = {
      no_ktp: (data as any).kartu_tanda_penyidik_no_ktp || null,
      tgl_ktp: (data as any).kartu_tanda_penyidik_tgl_ktp
        ? (data as any).kartu_tanda_penyidik_tgl_ktp
            .toISOString()
            .split('T')[0]
        : null,
      tgl_berlaku_ktp: (data as any).karta_tanda_penyidik_tgl_berlaku_ktp
        ? (data as any).karta_tanda_penyidik_tgl_berlaku_ktp
            .toISOString()
            .split('T')[0]
        : null,
    };

    return {
      id: result.id,
      id_surat: result.id_surat,
      identitas_pns: identitasPns,
      wilayah_kerja: wilayahKerja,
      lokasi_penempatan: lokasiPenempatan,
      kartu_tanda_penyidik: kartuTandaPenyidik,
    };
  }

  async updatePpnsUploadIdPpns(
    id_surat: number,
    id_ppns: number,
    userId: number,
  ) {
    console.log('DEBUG updatePpnsUploadIdPpns:', { id_surat, id_ppns });

    const updated = await this.prismaService.ppnsUpload.updateMany({
      where: {
        id_surat,
        OR: [
          { id_data_ppns: null }, // kalau NULL
          { id_data_ppns: 0 }, // kalau default-nya 0
          { id_data_ppns: userId }, // atau masih pakai userId sementara
        ],
      },
      data: { id_data_ppns: id_ppns },
    });

    console.log('DEBUG update result:', updated);
    return updated;
  }

  async createOrUpdatePpnsUpload(
    idTransaksi: number,
    dataUpload: {
      id_surat: number;
      id_ppns: number | null;
      file_type: string;
      original_name: string;
      keterangan?: string;
      s3_key: string;
      mime_type?: string;
      file_size?: number;
      status?: string;
      id_file_type?: number | null;
    }[],
  ) {
    // ✅ 1. Pastikan id_surat valid
    const surat = await this.prismaService.ppnsSurat.findUnique({
      where: { id: idTransaksi },
    });

    if (!surat) {
      throw new Error(
        `❌ Gagal menyimpan upload: id_surat ${idTransaksi} tidak ditemukan di tabel PpnsSurat`,
      );
    }

    for (const d of dataUpload) {
      // ✅ 2. Pastikan data upload tidak kosong
      if (!d.s3_key || !d.original_name) {
        console.log(`⏭ Skip file_type ${d.file_type}, karena file kosong`);
        continue;
      }

      // ✅ 3. Cari existing berdasarkan id_surat (idTransaksi) dan file_type
      const existing = await this.prismaService.ppnsUpload.findFirst({
        where: {
          id_surat: idTransaksi,
          file_type: d.file_type,
        },
      });

      if (existing) {
        // ✅ 4. Update existing upload (hanya field yang ada nilai)
        await this.prismaService.ppnsUpload.update({
          where: { id: existing.id },
          data: {
            id_surat: idTransaksi, // selalu pakai idTransaksi
            id_data_ppns: d.id_ppns ?? existing.id_data_ppns,
            id_file_type: d.id_file_type
              ? Number(d.id_file_type)
              : existing.id_file_type,
            file_type: this.cleanString(d.file_type) ?? existing.file_type,
            original_name:
              this.cleanString(d.original_name) ?? existing.original_name,
            status: this.normalizeStatus(d.status) ?? existing.status,
            keterangan: this.cleanString(d.keterangan) ?? existing.keterangan,
            s3_key: this.cleanString(d.s3_key) ?? existing.s3_key,
            mime_type: this.cleanString(d.mime_type) ?? existing.mime_type,
            file_size: d.file_size ?? existing.file_size ?? 0,
            uploaded_at: new Date(),
          },
        });
      } else {
        // ✅ 5. Insert baru
        await this.prismaService.ppnsUpload.create({
          data: {
            id_surat: idTransaksi, // selalu valid karena kita sudah cek di atas
            id_data_ppns: d.id_ppns,
            id_file_type: d.id_file_type,
            file_type: this.cleanString(d.file_type) ?? '',
            original_name: this.cleanString(d.original_name) ?? '',
            status: this.normalizeStatus(d.status),
            keterangan: this.cleanString(d.keterangan),
            s3_key: this.cleanString(d.s3_key) ?? '',
            mime_type: this.cleanString(d.mime_type) ?? 'application/pdf',
            file_size: d.file_size ?? 0,
            uploaded_at: new Date(),
          },
        });
      }
    }

    return { message: '✅ Upload dokumen berhasil disimpan/diupdate' };
  }

  private normalizeStatus(status?: string): status_upload_ii | null {
    const allowed: status_upload_ii[] = [
      'pending',
      'sesuai',
      'tidakSesuai',
      'tolak',
    ];
    if (!status || !allowed.includes(status as status_upload_ii))
      return 'pending';
    return status as status_upload_ii;
  }

  private cleanString(value?: string | null): string | null {
    if (!value) return null;
    // hapus null byte
    return value.replace(/\x00/g, '').trim();
  }
}
