import type { Express } from "express";

export class CreateResponsePengangkatanPpnsDto {
  id: number | null;
  id_surat: number | null;
  id_data_ppns: number | null;
  nama_sekolah: string | null;
  gelar_terakhir: string | null;
  no_ijazah: string | null;
  tgl_ijazah: string | null;
  tahun_lulus: string | null;
  no_sttpl: string | null;
  tgl_sttpl: string | null;
  tgl_verifikasi: string | null;
  teknis_operasional_penegak_hukum: boolean | null;
  jabatan: string | null;
  cek_surat_polisi: boolean | null;
  no_surat_polisi: string | null;
  tgl_surat_polisi: string | null;
  perihal_surat_polisi: string | null;
  no_tanda_terima_polisi: string | null;
  tgl_tanda_terima_polisi: string | null;
  perihal_tanda_terima_polisi: string | null;
  cek_surat_kejaksaan_agung: boolean | null;
  no_surat_kejaksaan_agung: string | null;
  tgl_surat_kejaksaan_agung: string | null;
  perihal_surat_kejaksaan_agung: string | null;
  no_tanda_terima_kejaksaan_agung: string | null;
  tgl_tanda_terima_kejaksaan_agung: string | null;
  perihal_tanda_terima_kejaksaan_agung: string | null;
}

export class FileResponseDto {
  original_name: string;
  mime_type: string;
  file_size: number;
  s3_key: string;
}

export class CreateResponsePermohonanVerifikasiUploadDokumenPpnsDto {
  message: string;
}
