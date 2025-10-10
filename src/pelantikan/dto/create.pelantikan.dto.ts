import type { Express } from "express";

export class CreateResponsePelantikanPpnsDto {
  id: number | null;
  id_surat: number | null;
  id_data_ppns: number | null;
  surat_permohonan: {
    no_surat: string | null;
    tgl_surat: string | null;
  };
  surat_ket_pengangkatan: {
    no_sk_induk: string | null;
    tgl_sk_induk: string | null;
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
