import {
  status_upload_ii,
} from '.prisma/main-client';

export class PpnsUploadDto {
  id_surat: number;
  id_ppns: number | null;
  file_type: string;
  original_name: string;
  keterangan: string;
  s3_key: string;
  mime_type: string;
  file_size: number;
  status: status_upload_ii;
  master_file_id?: number | null;
}