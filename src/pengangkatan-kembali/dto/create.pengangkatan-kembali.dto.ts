import type { Express } from 'express';

export class CreateResponsePengangkatanKembaliPpnsDto {
  id: number | null;
  id_surat: number | null;
  id_data_ppns: number | null;
  surat_sk_pemberhentian: {
    no_sk_pemberhentian: string | null;
    tgl_sk_pemberhentian: string | null;
  };
  surat_sk_terakhir: {
    no_sk_terakhir: string | null;
    tgl_sk_terakhir: string | null;
  };
  dp3: {
    tahun_dp3: string | null;
    nilai_dp3: number | null;
  }
  surat_skp: {
    nilai_skp: number | null;
    tgl_skp: string | null;
  };
  biodata_baru: {
    jabatan_baru: string | null;
    pangkat_golongan_baru: string | null;
  };
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
