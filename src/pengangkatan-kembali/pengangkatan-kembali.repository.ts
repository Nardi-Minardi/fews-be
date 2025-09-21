import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MasterPrismaService, PrismaService } from 'src/common/prisma.service';
import { Prisma, status_upload_ii } from '.prisma/main-client/client';
import { SuratRepository } from 'src/surat/surat.repository';
import { CreateResponsePengangkatanKembaliPpnsDto } from './dto/create.pengangkatan-kembali.dto';

export type PpnsPengangkatanKembaliUpdateInputWithExtra =
  Prisma.PpnsPengangkatanKembaliUpdateInput & {
    id_data_ppns?: number;
    no_sk_pemberhentian?: string | null;
    tgl_sk_pemberhentian?: Date | null;
    no_sk_terakhir?: string | null;
    tgl_sk_terakhir?: Date | null;
    tahun_dp3?: string | null;
    nilai_dp3?: number | null;
    tgl_skp?: Date | null;
    nilai_skp?: number | null;
    jabatan_baru?: string | null;
    pangkat_golongan?: string | null;
  };

@Injectable()
export class PengangkatanKembaliRepository {
  constructor(
    private readonly masterPrismaService: MasterPrismaService,
    private readonly prismaService: PrismaService,
    private readonly suratRepository: SuratRepository,
  ) {}

  async savePpnsPengangkatanKembali(
    id: number | null,
    data: PpnsPengangkatanKembaliUpdateInputWithExtra,
  ): Promise<CreateResponsePengangkatanKembaliPpnsDto> {
    // Cari id_surat lebih awal
    let idSurat: number | null = null;
    if (typeof data.id_data_ppns === 'number') {
      const pnsData = await this.suratRepository.findPpnsDataPnsById(
        Number(data.id_data_ppns),
      );
      if (!pnsData) throw new NotFoundException('Data PNS not found');
      idSurat = pnsData.id_surat ?? null;
    }

    // Jika id tidak ada → create, jika ada → update
    let result;
    if (id) {
      result = await this.prismaService.ppnsPengangkatanKembali.update({
        where: { id },
        data: {
          id_data_ppns: data.id_data_ppns,
          id_surat: idSurat ?? undefined,
          no_sk_pemberhentian: data.no_sk_pemberhentian,
          tgl_sk_pemberhentian: data.tgl_sk_pemberhentian,
          no_sk_terakhir: data.no_sk_terakhir,
          tgl_sk_terakhir: data.tgl_sk_terakhir,
          tahun_dp3: data.tahun_dp3,
          nilai_dp3: data.nilai_dp3,
          tgl_skp: data.tgl_skp,
          nilai_skp: data.nilai_skp,
          jabatan_baru: data.jabatan_baru,
          pangkat_golongan: data.pangkat_golongan,
        },
      });
    } else {
      result = await this.prismaService.ppnsPengangkatanKembali.create({
        data: {
          id_data_ppns: data.id_data_ppns ?? 0,
          id_surat: idSurat ?? undefined,
          no_sk_pemberhentian: data.no_sk_pemberhentian,
          tgl_sk_pemberhentian: data.tgl_sk_pemberhentian,
          no_sk_terakhir: data.no_sk_terakhir,
          tgl_sk_terakhir: data.tgl_sk_terakhir,
          tahun_dp3: data.tahun_dp3,
          nilai_dp3: data.nilai_dp3,
          tgl_skp: data.tgl_skp,
          nilai_skp: data.nilai_skp,
          jabatan_baru: data.jabatan_baru,
          pangkat_golongan: data.pangkat_golongan,
        },
      });
    }

    return {
      id: result.id,
      id_data_ppns: result.id_data_ppns,
      id_surat: idSurat,
      surat_sk_pemberhentian: {
        no_sk_pemberhentian: result.no_sk_pemberhentian ?? null,
        tgl_sk_pemberhentian: result.tgl_sk_pemberhentian
          ? result.tgl_sk_terakhir.toISOString()
          : null,
      },
      surat_sk_terakhir: {
        no_sk_terakhir: result.no_sk_terakhir ?? null,
        tgl_sk_terakhir: result.tgl_sk_terakhir
          ? result.tgl_sk_terakhir.toISOString()
          : null,
      },
      dp3: {
        tahun_dp3: result.tahun_dp3 ?? null,
        nilai_dp3: result.nilai_dp3 ?? null,
      },
      surat_skp: {
        nilai_skp: result.nilai_skp ?? null,
        tgl_skp: result.tgl_skp ? result.tgl_skp.toISOString() : null,
      },
      biodata_baru: {
        jabatan_baru: result.jabatan_baru ?? null,
        pangkat_golongan_baru: result.pangkat_golongan ?? null,
      },
    };
  }

  async findPpnsPengangkatanKembaliByIdDataPpns(id_data_ppns: number) {
    return this.prismaService.ppnsPengangkatanKembali.findFirst({
      where: { id_data_ppns: id_data_ppns },
    });
  }

  async findPpnsDataPnsById(id: number) {
    return this.prismaService.ppnsDataPns.findFirst({
      where: { id },
      include: {
        ppns_wilayah_kerja: true,
      },
    });
  }

  async createOrUpdatePpnsUpload(
    idTransaksi: number,
    dataUpload: {
      id_surat: number;
      id_ppns: number;
      file_type: string;
      original_name: string;
      keterangan?: string;
      s3_key: string;
      mime_type?: string;
      file_size?: number;
      status?: string;
      id_file_type?: number | null;
    }[],
  ) {
    for (const d of dataUpload) {
      // skip kalau semua field file kosong/null
      if (!d.s3_key || !d.original_name) {
        console.log(`Skip update untuk file_type ${d.file_type}, data null`);
        continue;
      }

      // cek apakah record dengan id_transaksi + file_type sudah ada
      const existing = await this.prismaService.ppnsUpload.findFirst({
        where: {
          id_surat: idTransaksi,
          file_type: d.file_type,
        },
      });

      if (existing) {
        // update hanya dengan data baru (tidak overwrite dengan null)
        await this.prismaService.ppnsUpload.update({
          where: { id: existing.id },
          data: {
            id_surat: d.id_surat,
            id_data_ppns: d.id_ppns,
            file_type: this.cleanString(d.file_type) ?? existing.file_type,
            id_file_type: d.id_file_type ?? existing.id_file_type,
            original_name:
              this.cleanString(d.original_name) ?? existing.original_name,
            status: this.normalizeStatus(d.status) ?? existing.status,
            keterangan: this.cleanString(d.keterangan) ?? existing.keterangan,
            s3_key: this.cleanString(d.s3_key) ?? existing.s3_key,
            mime_type: this.cleanString(d.mime_type) ?? existing.mime_type,
            file_size: d.file_size ?? 0,
            uploaded_at: new Date(),
          },
        });
      } else {
        // insert baru kalau belum ada sama sekali
        await this.prismaService.ppnsUpload.create({
          data: {
            id_surat: d.id_surat,
            id_data_ppns: d.id_ppns,
            file_type: this.cleanString(d.file_type) ?? '',
            id_file_type: d.id_file_type ?? null,
            original_name: this.cleanString(d.original_name) ?? '',
            status: this.normalizeStatus(d.status),
            keterangan: this.cleanString(d.keterangan),
            s3_key: this.cleanString(d.s3_key) ?? '',
            mime_type: this.cleanString(d.mime_type) ?? 'application/pdf',
            file_size: d.file_size ?? 0,
            uploaded_at: new Date(),
          },
        });
      }
    }

    return { message: 'Upload dokumen berhasil disimpan/diupdate' };
  }

  private normalizeStatus(status?: string): status_upload_ii | null {
    const allowed: status_upload_ii[] = [
      'pending',
      'sesuai',
      'tidakSesuai',
      'tolak',
    ];
    if (!status || !allowed.includes(status as status_upload_ii))
      return 'pending';
    return status as status_upload_ii;
  }

  private cleanString(value?: string | null): string | null {
    if (!value) return null;
    // hapus null byte
    return value.replace(/\x00/g, '').trim();
  }
}
