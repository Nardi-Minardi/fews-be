import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MasterPrismaService, PrismaService } from 'src/common/prisma.service';
import { Prisma, status_upload_ii } from '.prisma/main-client/client';
import { SuratRepository } from 'src/surat/surat.repository';
import { CreateResponsePengangkatanPpnsDto } from './dto/create.pelantikan.dto';

export type PpnsPengangkatanCreateInputWithExtra =
  Prisma.PpnsPengangkatanCreateInput & {
    gelar_terakhir?: string;
    no_surat_polisi?: string;
    tgl_surat_polisi?: Date;
    perihal_surat_polisi?: string;
    no_tanda_terima_polisi?: string;
    tgl_tanda_terima_polisi?: Date;
    perihal_tanda_terima_polisi?: string;
    no_surat_kejaksaan_agung?: string;
    tgl_surat_kejaksaan_agung?: Date;
    perihal_surat_kejaksaan_agung?: string;
    no_tanda_terima_kejaksaan_agung?: string;
    tgl_tanda_terima_kejaksaan_agung?: Date;
    perihal_tanda_terima_kejaksaan_agung?: string;
  };

export type PpnsPengangkatanUpdateInputWithExtra =
  Prisma.PpnsPengangkatanUpdateInput & {
    gelar_terakhir?: string;
    no_surat_polisi?: string;
    tgl_surat_polisi?: Date;
    perihal_surat_polisi?: string;
    no_tanda_terima_polisi?: string;
    tgl_tanda_terima_polisi?: Date;
    perihal_tanda_terima_polisi?: string;
    no_surat_kejaksaan_agung?: string;
    tgl_surat_kejaksaan_agung?: Date;
    perihal_surat_kejaksaan_agung?: string;
    no_tanda_terima_kejaksaan_agung?: string;
    tgl_tanda_terima_kejaksaan_agung?: Date;
    perihal_tanda_terima_kejaksaan_agung?: string;
  };

@Injectable()
export class PelantikanRepository {
  constructor(
    private readonly masterPrismaService: MasterPrismaService,
    private readonly prismaService: PrismaService,
    private readonly suratRepository: SuratRepository,
  ) {}

  async savePpnsPengangkatan(
    data: PpnsPengangkatanCreateInputWithExtra,
  ): Promise<CreateResponsePengangkatanPpnsDto> {
    const result = await this.prismaService.ppnsPengangkatan.create({
      data,
    });

    let idSurat: number | null = null;
    if (typeof result.id_data_ppns === 'number') {
      const d = await this.suratRepository.findPpnsDataPnsById(
        result.id_data_ppns,
      );
      if (!d) throw new NotFoundException('Data PNS not found');
      idSurat = d.id_surat ?? null;
    }

    

    return {
      id: result.id ?? null,
      id_surat: idSurat,
      id_data_ppns: result.id_data_ppns ?? null,
      nama_sekolah: result.nama_sekolah ?? null,

      // ✅ ambil dari request payload
      gelar_terakhir: data.gelar_terakhir ?? null,

      no_ijazah: result.no_ijazah ?? null,
      tgl_ijazah: result.tgl_ijazah ? result.tgl_ijazah.toISOString() : null,
      tahun_lulus: result.tahun_lulus ? String(result.tahun_lulus) : null,
      no_sttpl: result.no_sttpl ?? null,
      tgl_sttpl: result.tgl_sttpl ? result.tgl_sttpl.toISOString() : null,
      tgl_verifikasi: result.tgl_verifikasi
        ? result.tgl_verifikasi.toISOString()
        : null,
      teknis_operasional_penegak_hukum:
        result.teknis_operasional_penegak_hukum !== null &&
        result.teknis_operasional_penegak_hukum !== undefined &&
        result.teknis_operasional_penegak_hukum === '1'
          ? true
          : result.teknis_operasional_penegak_hukum === '0'
            ? false
            : null,
      jabatan: result.jabatan ?? null,

      cek_surat_polisi:
        result.cek_surat_polisi !== null
          ? Boolean(result.cek_surat_polisi)
          : null,

      // ✅ ambil dari request payload
      no_surat_polisi: data.no_surat_polisi ?? null,
      tgl_surat_polisi: data.tgl_surat_polisi
        ? data.tgl_surat_polisi.toISOString()
        : null,
      perihal_surat_polisi: data.perihal_surat_polisi ?? null,
      no_tanda_terima_polisi: data.no_tanda_terima_polisi ?? null,
      tgl_tanda_terima_polisi: data.tgl_tanda_terima_polisi
        ? data.tgl_tanda_terima_polisi.toISOString()
        : null,
      perihal_tanda_terima_polisi: data.perihal_tanda_terima_polisi ?? null,

      cek_surat_kejaksaan_agung:
        result.cek_surat_kejaksaan_agung !== null
          ? Boolean(result.cek_surat_kejaksaan_agung)
          : null,

      // ✅ ambil dari request payload
      no_surat_kejaksaan_agung: data.no_surat_kejaksaan_agung ?? null,
      tgl_surat_kejaksaan_agung: data.tgl_surat_kejaksaan_agung
        ? data.tgl_surat_kejaksaan_agung.toISOString()
        : null,
      perihal_surat_kejaksaan_agung: data.perihal_surat_kejaksaan_agung ?? null,
      no_tanda_terima_kejaksaan_agung:
        data.no_tanda_terima_kejaksaan_agung ?? null,
      tgl_tanda_terima_kejaksaan_agung: data.tgl_tanda_terima_kejaksaan_agung
        ? data.tgl_tanda_terima_kejaksaan_agung.toISOString()
        : null,
      perihal_tanda_terima_kejaksaan_agung:
        data.perihal_tanda_terima_kejaksaan_agung ?? null,
      // ✅ Ambil dari DB, bukan dari request
     
    };
  }

  async updatePpnsPengangkatan(
    id: number,
    data: PpnsPengangkatanUpdateInputWithExtra,
  ): Promise<CreateResponsePengangkatanPpnsDto> {
    // Cari id_surat lebih awal
    let idSurat: number | null = null;
    if (typeof data.id_data_ppns === 'number') {
      const pnsData = await this.suratRepository.findPpnsDataPnsById(
        Number(data.id_data_ppns),
      );
      if (!pnsData) throw new NotFoundException('Data PNS not found');
      idSurat = pnsData.id_surat ?? null;
    }

    const result = await this.prismaService.ppnsPengangkatan.update({
      where: { id },
      data,
    });

    const uploads = await this.prismaService.ppnsUpload.findMany({
      where: {
        id_data_ppns: Number(data.id_data_ppns),
        id_surat: idSurat,
        file_type: {
          in: [
            'dokumen-tanda-terima-polisi',
            'dokumen-tanda-terima-kejaksaan-agung',
          ],
        },
      },
    });

    const dokPolisi = uploads.find(
      (u) => u.file_type === 'dokumen-tanda-terima-polisi',
    );
    const dokKejaksaan = uploads.find(
      (u) => u.file_type ===  'dokumen-tanda-terima-kejaksaan-agung',
    );

    return {
      id: result.id ?? null,
      id_surat: idSurat,
      id_data_ppns: result.id_data_ppns ?? null,
      nama_sekolah: result.nama_sekolah ?? null,

      // ✅ ambil dari request payload
      gelar_terakhir: data.gelar_terakhir ?? null,

      no_ijazah: result.no_ijazah ?? null,
      tgl_ijazah: result.tgl_ijazah ? result.tgl_ijazah.toISOString() : null,
      tahun_lulus: result.tahun_lulus ? String(result.tahun_lulus) : null,
      no_sttpl: result.no_sttpl ?? null,
      tgl_sttpl: result.tgl_sttpl ? result.tgl_sttpl.toISOString() : null,
      tgl_verifikasi: result.tgl_verifikasi
        ? result.tgl_verifikasi.toISOString()
        : null,
      teknis_operasional_penegak_hukum:
        result.teknis_operasional_penegak_hukum !== null &&
        result.teknis_operasional_penegak_hukum !== undefined &&
        result.teknis_operasional_penegak_hukum === '1'
          ? true
          : result.teknis_operasional_penegak_hukum === '0'
            ? false
            : null,
      jabatan: result.jabatan ?? null,

      cek_surat_polisi:
        result.cek_surat_polisi !== null
          ? Boolean(result.cek_surat_polisi)
          : null,

      // ✅ ambil dari request payload
      no_surat_polisi: data.no_surat_polisi ?? null,
      tgl_surat_polisi: data.tgl_surat_polisi
        ? data.tgl_surat_polisi.toISOString()
        : null,
      perihal_surat_polisi: data.perihal_surat_polisi ?? null,
      no_tanda_terima_polisi: data.no_tanda_terima_polisi ?? null,
      tgl_tanda_terima_polisi: data.tgl_tanda_terima_polisi
        ? data.tgl_tanda_terima_polisi.toISOString()
        : null,
      perihal_tanda_terima_polisi: data.perihal_tanda_terima_polisi ?? null,

      cek_surat_kejaksaan_agung:
        result.cek_surat_kejaksaan_agung !== null
          ? Boolean(result.cek_surat_kejaksaan_agung)
          : null,

      // ✅ ambil dari request payload
      no_surat_kejaksaan_agung: data.no_surat_kejaksaan_agung ?? null,
      tgl_surat_kejaksaan_agung: data.tgl_surat_kejaksaan_agung
        ? data.tgl_surat_kejaksaan_agung.toISOString()
        : null,
      perihal_surat_kejaksaan_agung: data.perihal_surat_kejaksaan_agung ?? null,
      no_tanda_terima_kejaksaan_agung:
        data.no_tanda_terima_kejaksaan_agung ?? null,
      tgl_tanda_terima_kejaksaan_agung: data.tgl_tanda_terima_kejaksaan_agung
        ? data.tgl_tanda_terima_kejaksaan_agung.toISOString()
        : null,
      perihal_tanda_terima_kejaksaan_agung:
        data.perihal_tanda_terima_kejaksaan_agung ?? null,
    };
  }

  async findPpnsPengangkatanById(id_data_ppns: number) {
    return this.prismaService.ppnsPengangkatan.findFirst({
      where: { id_data_ppns: id_data_ppns },
    });
  }

  async createOrUpdateVerifikasiPpnsUpload(
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
