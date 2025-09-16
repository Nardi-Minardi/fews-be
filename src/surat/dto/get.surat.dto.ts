import { Pagination } from "src/common/web.response";

export class SuratPaginationDto {
  layanan?: string;
  search?: string;
  page: string;
  limit: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export class GetSuratPaginationDto {
  data: ListSurat[];
  pagination: Pagination;
}

export class ListSurat {
  id: number | null;
  id_user: number | null;
  lembaga_kementerian: number | null;
  instansi: number | null;
  no_surat: string | null;
  tgl_surat: string | null; // ISO date string
  perihal: string | null;
  nama_pengusul: string | null;
  jabatan_pengusul: string | null;
  status: boolean | null;
  created_at: string; // ISO date string
  created_by: number | null;
  verifikator_by: number | null;
  verifikator_at: string | null; // ISO date string | null
  id_layanan: number | null;
  nama_kementerian: string | null;
  nama_instansi: string | null;
  // ppns_upload : any [];
  // ppns_data_pns : any [];
  // ppns_verifikasi_ppns : any [];
}

export class GetCalonPemohonPaginationDto {
  data: ListCalonPemohon[];
  pagination: Pagination;
}

export class ListCalonPemohon {
  id: number | null;
  id_surat: number | null;
  no_surat: string | null;
  nama: string | null;
  nip: string | null;
  nama_gelar: string | null;
  jabatan: string | null;
  pangkat_atau_golongan: string | null;
  jenis_kelamin: string | null;
  agama: number | null;
  nama_sekolah: string | null;
  gelar_terakhir: string | null;
  no_ijazah: string | null;
  tgl_ijazah: string | null; // ISO date string
  tahun_lulus: string | null;
  ppns_wilayah_kerja?: ListWilayahKerja[] | null;
}

export class ListWilayahKerja {
  id: number | null;
  id_ppns: number | null;
  id_surat: number | null;
  uu_dikawal: string[] | null;
}