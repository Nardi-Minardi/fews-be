export class CreateResponseSuratDto {
  id: number | null;
  id_user:number | null;
  id_layanan: number | null;
  lembaga_kementerian: number | null;
  instansi: number | null;
  no_surat: string | null;
  tgl_surat: string | null;
  perihal: string | null;
  nama_pengusul: string | null;
  jabatan_pengusul: string | null;
  status: boolean;
  created_at: string | null;
  created_by: number | null;
  verifikator_by: number | null;
  verifikator_at: string | null;
  dok_surat_pernyataan?: any;
}

export class CreateResponsePpnsDataPnsDto {
  id: number | null;
  id_surat: number | null;
  identitas_pns: any | null;
  wilayah_kerja: any []; 
  lokasi_penempatan: any | null;
}


export class CreateResponseUploadDokumenPpnsDto {
  message: string;
}

export class CreateRequestSendVerifikatorDto {
  message: string;
}

export class CreateResponseSendVerifikatorDto {
  message: string;
}
