export class NotarisPenggantiDto {
  id: number;
  nama: string | null;
  provinsi: string | null;
  id_provinsi: number | null;
}

export class ResponseNotarisPenggantiDto {
  countData: number;
  list: NotarisPenggantiDto[];
}
