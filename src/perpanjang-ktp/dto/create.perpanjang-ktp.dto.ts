import type { Express } from 'express';

export class CreateResponsePerpanjangKtpPpnsDto {
  id: number | null;
  id_surat: number | null;
  id_data_ppns: number | null;
  kartu_tanda_penyidik: {
    no_ktp: string | null;
    tgl_ktp: string | null;
    tgl_berlaku_ktp: string | null;
  };
  surat_petikan: {
    no_surat_petikan: string | null;
    tgl_surat_petikan: string | null;
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
