import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MasterPrismaService, PrismaService } from 'src/common/prisma.service';
import { Prisma, status_upload_ii } from '.prisma/main-client/client';
import { SuratRepository } from 'src/surat/surat.repository';
import { CreateResponsePenerbitanKembaliKtpPpnsDto } from './dto/create.penerbitan-kembali-ktp.dto';

export type PpnsPenerbitanKembaliKtpUpdateInputWithExtra = Prisma.PpnsPenerbitanKembaliKtpUpdateInput & {
  id_data_ppns?: number;
  no_surat_petikan?: string | null;
  tgl_surat_petikan?: Date | null;
  no_ktp?: string | null;
  tgl_ktp?: Date | null;
  tgl_berlaku_ktp?: Date | null;
};

@Injectable()
export class PenerbitanKembaliKtpRepository {
  constructor(
    private readonly masterPrismaService: MasterPrismaService,
    private readonly prismaService: PrismaService,
    private readonly suratRepository: SuratRepository,
  ) {}

  async savePpnsPerpanjangKtp(
    id: number | null,
    data: PpnsPenerbitanKembaliKtpUpdateInputWithExtra,
  ): Promise<CreateResponsePenerbitanKembaliKtpPpnsDto> {
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
      result = await this.prismaService.ppnsPerpanjangKtp.update({
        where: { id },
        data: {
          id_data_ppns: data.id_data_ppns,
          id_surat: idSurat ?? undefined,
          no_surat_petikan: data.no_surat_petikan ?? undefined,
          tgl_surat_petikan: data.tgl_surat_petikan ?? undefined,
          no_ktp: data.no_ktp ?? undefined,
          tgl_ktp: data.tgl_ktp ?? undefined,
          tgl_berlaku_ktp: data.tgl_berlaku_ktp ?? undefined,
        },
      });
    } else {
      result = await this.prismaService.ppnsPerpanjangKtp.create({
        data: {
          id_data_ppns: data.id_data_ppns,
          id_surat: idSurat ?? undefined,
          no_surat_petikan: data.no_surat_petikan ?? undefined,
          tgl_surat_petikan: data.tgl_surat_petikan ?? undefined,
          no_ktp: data.no_ktp ?? undefined,
          tgl_ktp: data.tgl_ktp ?? undefined,
          tgl_berlaku_ktp: data.tgl_berlaku_ktp ?? undefined,
        },
      });
    }

    // bentuk response DTO sesuai format kamu
    return {
      id: result.id ?? null,
      id_surat: idSurat,
      id_data_ppns: result.id_data_ppns ?? null,
      kartu_tanda_penyidik: {
        no_ktp: data.no_ktp ?? null,
        tgl_ktp: data.tgl_ktp
          ? data.tgl_ktp.toISOString().split('T')[0]
          : null,
        tgl_berlaku_ktp: data.tgl_berlaku_ktp
          ? data.tgl_berlaku_ktp.toISOString().split('T')[0]
          : null,
      },
      surat_petikan: {
        no_surat_petikan: data.no_surat_petikan ?? null,
        tgl_surat_petikan: data.tgl_surat_petikan
          ? data.tgl_surat_petikan.toISOString().split('T')[0]
          : null,
      },
    };
  }

  async findPpnsPerpanjangKtpByIdDataPpns(id_data_ppns: number) {
    return this.prismaService.ppnsPerpanjangKtp.findFirst({
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
