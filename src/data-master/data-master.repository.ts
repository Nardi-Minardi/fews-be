import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MasterPrismaService, PrismaService } from 'src/common/prisma.service';
import { Kbli, NotarisPengganti, Prisma, Wilayah } from '.prisma/master-client';
import { PpnsInstansi, PpnsKementerian } from '.prisma/main-client/client';
import {
  ListDataPpnsDto,
  ListInstansiDto,
  ListKementerianDto,
  ListLayananDto,
  ListPangkatGolonganDto,
} from './dto/data-master.dto';
import {
  dataPpnsAllowedFields,
  instansiAllowedFields,
  kementerianAllowedFields,
  layananAllowedFields,
} from 'src/common/constants/data-master.fields';

@Injectable()
export class DataMasterRepository {
  constructor(
    private readonly masterPrismaService: MasterPrismaService,
    private readonly prismaService: PrismaService,
  ) {}

  async findNotarisPenggantiByNama(nama: string): Promise<NotarisPengganti[]> {
    const notarisPengganti =
      await this.masterPrismaService.notarisPengganti.findMany({
        where: {
          nama: {
            contains: nama,
            mode: 'insensitive',
          },
        },
      });

    if (!notarisPengganti.length) {
      throw new NotFoundException(
        `Notaris Pengganti with name ${nama} not found`,
      );
    }

    return notarisPengganti;
  }

  async findNotarisPenggantiById(
    idNotaris: number,
  ): Promise<NotarisPengganti | null> {
    const notaris = await this.masterPrismaService.notarisPengganti.findFirst({
      where: { id: idNotaris },
    });

    return notaris;
  }

  async findKbliById(idKbli: number): Promise<Kbli | null> {
    const kbli = await this.masterPrismaService.kbli.findFirst({
      where: { id_kbli: idKbli },
    });

    return kbli;
  }

  async findProvinsiById(idProvinsi: string): Promise<Wilayah | null> {
    const provinsi = await this.masterPrismaService.wilayah.findFirst({
      where: { id: idProvinsi },
    });

    return provinsi;
  }

  async findKabupatenById(idKabupaten: string): Promise<Wilayah | null> {
    const kabupaten = await this.masterPrismaService.wilayah.findFirst({
      where: { id: idKabupaten },
    });

    return kabupaten;
  }

  async findKecamatanById(idKecamatan: string): Promise<Wilayah | null> {
    const kecamatan = await this.masterPrismaService.wilayah.findFirst({
      where: { id: idKecamatan },
    });

    return kecamatan;
  }

  async findKelurahanById(idKelurahan: string): Promise<Wilayah | null> {
    const kelurahan = await this.masterPrismaService.wilayah.findFirst({
      where: { id: idKelurahan },
    });

    return kelurahan;
  }

  async findKementerianById(
    idKementerian: number,
  ): Promise<PpnsKementerian | null> {
    const kementerian = await this.prismaService.ppnsKementerian.findFirst({
      where: { id: idKementerian },
      include: {
        ppns_instansi: true,
      },
    });
    return kementerian;
  }

  async findInstansiById(id: number): Promise<PpnsInstansi | null> {
    const instansi = await this.prismaService.ppnsInstansi.findFirst({
      where: { id: id },
      include: {
        ppns_kementerian: true,
      },
    });
    return instansi;
  }

  async findInstansiByIdKementerian(idKementerian: number): Promise<any> {
    const instansi = await this.prismaService.ppnsInstansi.findMany({
      where: { id_kementerian: idKementerian },
      include: {
        ppns_kementerian: true,
      },
    });
    return instansi;
  }

  async countSearchNotarisPengganti(
    search: string | undefined,
  ): Promise<number> {
    let where;
    if (search)
      where = {
        OR: [
          {
            nama: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      };
    else where = {};

    return this.masterPrismaService.notarisPengganti.count({ where });
  }

  async countSearchKementerian(search: string | undefined): Promise<number> {
    // base where
    const where: any = {};

    // filter search hanya kalau ada
    if (search) {
      where.OR = [{ nama: { contains: search, mode: 'insensitive' } }];
    }

    return this.prismaService.ppnsKementerian.count({ where });
  }

  async findAllWithPaginationKementerian(
    search: string | undefined,
    page: number,
    limit: number,
    orderBy: string | undefined = 'created_at',
    orderDirection: 'asc' | 'desc' = 'desc',
    filters?: Array<{ field: string; value: string }>,
  ): Promise<ListKementerianDto[]> {
    if (!kementerianAllowedFields.includes(orderBy)) {
      throw new BadRequestException(
        `Field orderBy '${orderBy}' tidak valid. Gunakan salah satu: ${kementerianAllowedFields.join(', ')}`,
      );
    }

    // base where
    const where: any = {};
    // global search
    if (search) {
      const orConditions: any[] = [
        { nama: { contains: search, mode: 'insensitive' } },
      ];
      if (!isNaN(Number(search))) {
        // kalau kolom Int
        orConditions.push({ id: Number(search) });
      }
      where.OR = orConditions;
    }

    // --- filters ---
    if (filters && Object.keys(filters).length > 0) {
      const numberFields = ['id'];
      const stringFields = ['nama'];
      const enumFields = [];

      const filterConditions: any[] = [];

      for (const [field, value] of Object.entries(filters)) {
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
      }

      if (filterConditions.length > 0) {
        where.AND = filterConditions; // AND supaya semua filter cocok
      }
    }

    const results = await this.prismaService.ppnsKementerian.findMany({
      where,
      // skip: (page - 1) * limit, //matikan dulu pagination
      // take: limit, //matikan dulu pagination
      orderBy: { [orderBy]: orderDirection },
      include: { ppns_instansi: true },
    });

    return results.map((item) => ({
      id: item.id,
      nama: item.nama,
      created_at: item.created_at ? item.created_at.toISOString() : null,
      ppns_instansi: item.ppns_instansi,
    }));
  }

  async countSearchInstansi(search: string | undefined): Promise<number> {
    // base where
    const where: any = {};

    // filter search hanya kalau ada
    if (search) {
      where.OR = [{ nama: { contains: search, mode: 'insensitive' } }];
    }

    return this.prismaService.ppnsInstansi.count({ where });
  }

  async findAllWithPaginationInstansi(
    search: string | undefined,
    page: number,
    limit: number,
    orderBy: string | undefined = 'created_at',
    orderDirection: 'asc' | 'desc' = 'desc',
    filters?: Array<{ field: string; value: string }>,
  ): Promise<ListInstansiDto[]> {
    if (!instansiAllowedFields.includes(orderBy)) {
      throw new BadRequestException(
        `Field orderBy '${orderBy}' tidak valid. Gunakan salah satu: ${instansiAllowedFields.join(', ')}`,
      );
    }

    // base where
    const where: any = {};
    // global search
    if (search) {
      const orConditions: any[] = [
        { nama: { contains: search, mode: 'insensitive' } },
      ];
      if (!isNaN(Number(search))) {
        // kalau kolom Int
        orConditions.push({ id: Number(search) });
        orConditions.push({ id_kementerian: Number(search) });
      }
      where.OR = orConditions;
    }

    // --- filters ---
    if (filters && Object.keys(filters).length > 0) {
      const numberFields = ['id', 'id_kementerian'];
      const stringFields = ['nama'];
      const enumFields = [];

      const filterConditions: any[] = [];

      for (const [field, value] of Object.entries(filters)) {
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
      }

      if (filterConditions.length > 0) {
        where.AND = filterConditions; // AND supaya semua filter cocok
      }
    }

    const results = await this.prismaService.ppnsInstansi.findMany({
      where,
      // skip: (page - 1) * limit,
      // take: limit,
      orderBy: { [orderBy]: orderDirection },
      include: { ppns_kementerian: true },
    });

    return results.map((item) => ({
      id: item.id,
      nama: item.nama,
      id_kementerian: item.id_kementerian,
      ppns_kementerian: item.ppns_kementerian,
      created_at: item.created_at ? item.created_at.toISOString() : null,
    }));
  }

  async findAllWithPaginationLayanan(
    search: string | undefined,
    page: number,
    limit: number,
    orderBy: string | undefined = 'created_at',
    orderDirection: 'asc' | 'desc' = 'desc',
    filters?: Array<{ field: string; value: string }>,
  ): Promise<ListLayananDto[]> {
    if (!layananAllowedFields.includes(orderBy)) {
      throw new BadRequestException(
        `Field orderBy '${orderBy}' tidak valid. Gunakan salah satu: ${layananAllowedFields.join(', ')}`,
      );
    }

    // base where
    const where: any = {};
    // global search
    if (search) {
      const orConditions: any[] = [
        { nama: { contains: search, mode: 'insensitive' } },
      ];
      if (!isNaN(Number(search))) {
        // kalau kolom Int
        orConditions.push({ id: Number(search) });
      }
      where.OR = orConditions;
    }

    // --- filters ---
    if (filters && Object.keys(filters).length > 0) {
      const numberFields = ['id'];
      const stringFields = ['nama'];
      const enumFields = [];

      const filterConditions: any[] = [];

      for (const [field, value] of Object.entries(filters)) {
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
      }

      if (filterConditions.length > 0) {
        where.AND = filterConditions; // AND supaya semua filter cocok
      }
    }

    const results = await this.prismaService.ppnsLayanan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [orderBy]: orderDirection },
    });

    return results.map((item) => ({
      id: item.id,
      nama: item.nama,
      created_at: item.created_at ? item.created_at.toISOString() : null,
    }));
  }

  async countSearchLayanan(search: string | undefined): Promise<number> {
    // base where
    const where: any = {};

    // filter search hanya kalau ada
    if (search) {
      where.OR = [{ nama: { contains: search, mode: 'insensitive' } }];
    }

    return this.prismaService.ppnsLayanan.count({ where });
  }

  async findAllWithPaginationDataPpns(
    search: string | undefined,
    page: number,
    limit: number,
    orderBy: string | undefined = 'id',
    orderDirection: 'asc' | 'desc' = 'desc',
    filters?: Array<{ field: string; value: string }>,
  ): Promise<ListDataPpnsDto[]> {
    if (!dataPpnsAllowedFields.includes(orderBy)) {
      throw new BadRequestException(
        `Field orderBy '${orderBy}' tidak valid. Gunakan salah satu: ${dataPpnsAllowedFields.join(', ')}`,
      );
    }

    // base where
    const where: any = {};
    // global search
    if (search) {
      const orConditions: any[] = [
        { nama: { contains: search, mode: 'insensitive' } },
        { nip: { contains: search, mode: 'insensitive' } },
        { agama: { contains: search, mode: 'insensitive' } },
        { nama_sekolah: { contains: search, mode: 'insensitive' } },
        { gelar_terakhir: { contains: search, mode: 'insensitive' } },
        { no_ijazah: { contains: search, mode: 'insensitive' } },
        { tgl_ijazah: { contains: search, mode: 'insensitive' } },
      ];
      if (!isNaN(Number(search))) {
        // kalau kolom Int
        orConditions.push({ id: Number(search) });
      }
      where.OR = orConditions;
    }

    // --- filters ---
    if (filters && Object.keys(filters).length > 0) {
      const numberFields = ['id', 'id_surat', 'tahun_lulus'];
      const stringFields = ['nama', 'nip', 'nama_gelar', 'jabatan', 'pangkat_atau_golongan', 'jenis_kelamin', 'agama', 'nama_sekolah', 'gelar_terakhir', 'no_ijazah'];
      const enumFields = [];
      const dateFields = ['tgl_ijazah'];

      const filterConditions: any[] = [];

      for (const [field, value] of Object.entries(filters)) {
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

        // date
        if (dateFields.includes(field) && typeof value === 'string') {
          const dateValue = new Date(value);
          if (!isNaN(dateValue.getTime())) {
            filterConditions.push({ [field]: dateValue });
          }
          continue;
        }

        // enum: konversi label ke enum internal
      }

      if (filterConditions.length > 0) {
        where.AND = filterConditions; // AND supaya semua filter cocok
      }
    }

    const results = await this.prismaService.ppnsDataPns.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [orderBy]: orderDirection },
    });

    return results.map((item) => ({
      id: item.id,
      id_surat: item.id_surat || null,
      nama: item.nama || null,
      nip: item.nip || null,
      nama_gelar: item.nama_gelar || null,
      jabatan: item.jabatan || null,
      pangkat_atau_golongan: item.pangkat_golongan || null,
      jenis_kelamin: item.jenis_kelamin || null,
      agama: item.agama || null,
      nama_sekolah: item.nama_sekolah || null,
      gelar_terakhir: item.gelar_terakhir || null,
      no_ijazah: item.no_ijazah || null,
      tgl_ijazah: item.tgl_ijazah ? item.tgl_ijazah.toISOString() : null,
    }));
  }

  async countSearchDataPpns(search: string | undefined): Promise<number> {
    // base where
    const where: any = {};

    // filter search hanya kalau ada
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { nip: { contains: search, mode: 'insensitive' } },
        { agama: { contains: search, mode: 'insensitive' } },
        { nama_sekolah: { contains: search, mode: 'insensitive' } },
        { gelar_terakhir: { contains: search, mode: 'insensitive' } },
        { no_ijazah: { contains: search, mode: 'insensitive' } },
        { tgl_ijazah: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prismaService.ppnsDataPns.count({ where });
  }

  async countSearchPangkatGolongan(search: string | undefined): Promise<number> {
    // base where
    const where: any = {};

    // filter search hanya kalau ada
    if (search) {
      where.OR = [{ nama: { contains: search, mode: 'insensitive' } }];
    }

    return this.prismaService.ppnsPangkatGolongan.count({ where });
  }

  async findAllWithPaginationPangkatGolongan(
    search: string | undefined,
    page: number,
    limit: number,
    orderBy: string | undefined = 'created_at',
    orderDirection: 'asc' | 'desc' = 'desc',
    filters?: Array<{ field: string; value: string }>,
  ): Promise<ListPangkatGolonganDto[]> {
    if (!instansiAllowedFields.includes(orderBy)) {
      throw new BadRequestException(
        `Field orderBy '${orderBy}' tidak valid. Gunakan salah satu: ${instansiAllowedFields.join(', ')}`,
      );
    }

    // base where
    const where: any = {};
    // global search
    if (search) {
      const orConditions: any[] = [
        { nama: { contains: search, mode: 'insensitive' } },
      ];
      if (!isNaN(Number(search))) {
        // kalau kolom Int
        orConditions.push({ id: Number(search) });
        orConditions.push({ id_kementerian: Number(search) });
      }
      where.OR = orConditions;
    }

    // --- filters ---
    if (filters && Object.keys(filters).length > 0) {
      const numberFields = ['id'];
      const stringFields = ['nama'];
      const enumFields = [];

      const filterConditions: any[] = [];

      for (const [field, value] of Object.entries(filters)) {
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
      }

      if (filterConditions.length > 0) {
        where.AND = filterConditions; // AND supaya semua filter cocok
      }
    }

    const results = await this.prismaService.ppnsPangkatGolongan.findMany({
      where,
      // skip: (page - 1) * limit,
      // take: limit,
      orderBy: { [orderBy]: orderDirection },
    });

    return results.map((item) => ({
      id: item.id,
      kode_golongan: item.kode_golongan || null,
      nama_pangkat: item.nama_pangkat || null,
      created_at: item.created_at ? item.created_at.toISOString() : null,
      updated_at: item.updated_at ? item.updated_at.toISOString() : null,
    }));
  }

  async findPangkatGolonganById(id: number): Promise<any> {
    return this.prismaService.ppnsPangkatGolongan.findFirst({
      where: { id },
    });
  }
}
