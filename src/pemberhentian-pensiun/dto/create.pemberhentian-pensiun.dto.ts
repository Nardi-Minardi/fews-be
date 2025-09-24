import type { Express } from 'express';

export class CreateResponsePensiunPpnsDto {
  id: number | null;
  id_surat: number | null;
  id_data_ppns: number | null;
  sk_pengangkatan_pns: {
    no_sk_pengangkatan_pns: string | null;
    tgl_sk_pengangkatan_pns: string | null;
  };
  sk_kenaikan_pangkat: {
    tgl_sk_kenaikan_pangkat: string | null;
    no_sk_kenaikan_pangkat: string | null;
  };
  ktp_ppns: {
    tgl_berlaku_ktp: string | null;
    no_ktp: string | null;
  };
  sk_bkn: {
    no_sk_bkn: string | null;
    tgl_sk_bkn: string | null;
  };
}

export class FileResponseDto {
  original_name: string;
  mime_type: string;
  file_size: number;
  s3_key: string;
}

export class CreateResponseUploadDokumenPpnsDto {
  message: string;
}
