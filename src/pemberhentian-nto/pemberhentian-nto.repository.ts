import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MasterPrismaService, PrismaService } from 'src/common/prisma.service';
import { Prisma, status_upload_ii } from '.prisma/main-client/client';
import { SuratRepository } from 'src/surat/surat.repository';
import { CreateResponseNtoPpnsDto } from './dto/create.pemberhentian-nto.dto';

export type PpnsNtoUpdateInputWithExtra = Prisma.PpnsPemberhentianNtoUpdateInput & {
  id_data_ppns?: number;
  no_sk_pengangkatan_pns?: string | null;
  tgl_sk_pengangkatan_pns?: Date | null;
  no_sk_kenaikan_pangkat?: string | null;
  tgl_sk_kenaikan_pangkat?: Date | null;
  no_ktp?: string | null;
  tgl_berlaku_ktp?: Date | null;
  no_sk_pemberhentian?: string | null;
  tgl_sk_pemberhentian?: Date | null;
};

@Injectable()
export class PemberhentianNtoRepository {
  constructor(
    private readonly masterPrismaService: MasterPrismaService,
    private readonly prismaService: PrismaService,
    private readonly suratRepository: SuratRepository,
  ) {}

  async savePpnsPensiun(
    id: number | null,
    data: PpnsNtoUpdateInputWithExtra,
  ): Promise<CreateResponseNtoPpnsDto> {
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
      result = await this.prismaService.ppnsPemberhentianNto.update({
        where: { id },
        data: {
          id_data_ppns: data.id_data_ppns,
          id_surat: idSurat ?? undefined,
          no_sk_pengangkatan_pns: data.no_sk_pengangkatan_pns,
          tgl_sk_pengangkatan_pns: data.tgl_sk_pengangkatan_pns,
          no_sk_kenaikan_pangkat: data.no_sk_kenaikan_pangkat,
          tgl_sk_kenaikan_pangkat: data.tgl_sk_kenaikan_pangkat,
          no_ktp: data.no_ktp,
          tgl_berlaku_ktp: data.tgl_berlaku_ktp,
          no_sk_pemberhentian: data.no_sk_pemberhentian,
          tgl_sk_pemberhentian: data.tgl_sk_pemberhentian,
        },
      });
    } else {
      result = await this.prismaService.ppnsPemberhentianNto.create({
         data: {
          id_data_ppns: data.id_data_ppns,
          id_surat: idSurat ?? undefined,
          no_sk_pengangkatan_pns: data.no_sk_pengangkatan_pns ?? undefined,
          tgl_sk_pengangkatan_pns: data.tgl_sk_pengangkatan_pns ?? undefined,
          no_sk_kenaikan_pangkat: data.no_sk_kenaikan_pangkat ?? undefined,
          tgl_sk_kenaikan_pangkat: data.tgl_sk_kenaikan_pangkat ?? undefined,
          no_ktp: data.no_ktp ?? undefined,
          tgl_berlaku_ktp: data.tgl_berlaku_ktp ?? undefined,
          no_sk_pemberhentian: data.no_sk_pemberhentian ?? undefined,
          tgl_sk_pemberhentian: data.tgl_sk_pemberhentian ?? undefined,
        },
      });
    }

    // bentuk response DTO sesuai format kamu
    return {
      id: result.id ?? null,
      id_surat: idSurat,
      id_data_ppns: result.id_data_ppns ?? null,
      sk_pengangkatan_pns: {
        no_sk_pengangkatan_pns: result.no_sk_pengangkatan_pns ?? null,
        tgl_sk_pengangkatan_pns: result.tgl_sk_pengangkatan_pns
          ? result.tgl_sk_pengangkatan_pns.toISOString().split('T')[0]
          : null,
      },
      sk_kenaikan_pangkat: {
        tgl_sk_kenaikan_pangkat: result.tgl_sk_kenaikan_pangkat
          ? result.tgl_sk_kenaikan_pangkat.toISOString().split('T')[0]
          : null,
        no_sk_kenaikan_pangkat: result.no_sk_kenaikan_pangkat ?? null,
      },
      ktp_ppns: {
        tgl_berlaku_ktp: result.tgl_berlaku_ktp
          ? result.tgl_berlaku_ktp.toISOString().split('T')[0]
          : null,
        no_ktp: result.no_ktp ?? null,
      },
      sk_pemberhentian: {
        tgl_sk_pemberhentian: result.tgl_sk_pemberhentian
          ? result.tgl_sk_pemberhentian.toISOString().split('T')[0]
          : null,
        no_sk_pemberhentian: result.no_sk_pemberhentian ?? null,
      },
    };
  }

  async findPpnsPensiunByIdDataPpns(id_data_ppns: number) {
    return this.prismaService.ppnsPemberhentianNto.findFirst({
      where: { id_data_ppns: id_data_ppns },
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
