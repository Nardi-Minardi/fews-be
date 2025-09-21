export class GetResponsePengangkatanKembaliPpnsDto {
  id: number;
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
  surat_sk_pengangkatan_kembali: {
    no_sk_pengangkatan_kembali: string | null;
    tgl_sk_pengangkatan_kembali: string | null;
  };
  created_at: string;
  updated_at: string;
}
