import type { Express } from 'express';

export class CreateResponseMutasiPpnsDto {
  id: number | null;
  id_surat: number | null;
  id_data_ppns: number | null;
  surat_permohonan: {
    no_surat: string | null;
    tgl_surat: string | null;
  };
  surat_keputusan_pangkat: {
    no_keputusan_pangkat: string | null;
    tgl_keputusan_pangkat: string | null;
  };
  surat_keputusan_kenaikan_pangkat: {
    no_keputusan_kenaikan_pangkat: string | null;
    tgl_keputusan_kenaikan_pangkat: string | null;
  };
  surat_sk_mutasi_wilayah_kerja: {
    no_sk_mutasi_wilayah_kerja: string | null;
    tgl_sk_mutasi_wilayah_kerja: string | null;
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
