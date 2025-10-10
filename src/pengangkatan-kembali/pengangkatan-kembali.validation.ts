import { z, ZodType } from 'zod';
import dayjs from 'dayjs';

export class PengangkatanKembaliValidation {
  static readonly CREATE_PENGANGKATAN_KEMBALI_PPNS: ZodType = z.object({
    id_data_ppns: z.number(),
    surat_sk_pemberhentian: z.object({
      tgl_sk_pemberhentian: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          {
            message: 'Tanggal sk pemberhentian must be a valid date string',
          },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      no_sk_pemberhentian: z.string().min(1, 'No sk pemberhentian is required'),
    }),
    surat_sk_terakhir: z.object({
      tgl_sk_terakhir: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          {
            message: 'Tgl sk terakhir must be a valid date string',
          },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      no_sk_terakhir: z.string().min(1, 'No sk terakhir is required'),
    }),
    dp3: z.object({
      tahun_dp3: z
        .string()
        .min(1, 'No keputusan kenaikan pangkat is required')
        .max(4, 'Tahun dp3 max 4 characters'),
      nilai_dp3: z.enum(['SANGAT BAIK', 'BAIK', 'CUKUP']),
    }),
    surat_skp: z.object({
      tgl_skp: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          {
            message: 'Tgl SKP must be a valid date string',
          },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      nilai_skp: z.number().min(1, 'Nilai skp is required'),
    }),
    biodata_baru: z.object({
      jabatan_baru: z.string().min(1, 'Nilai skp is required'),
      pangkat_golongan_baru: z.string().min(1, 'Nilai skp is required'),
    }),
  });

  static readonly UPLOAD_DOKUMEN_PENGANGKATAN_KEMBALI_PPNS: ZodType = z.object({
    id_surat: z.string().min(1, 'id_surat is required'),
    id_ppns: z.string().min(1, 'id_ppns is required'),
    dok_pengangkatan_kembali_sk_pemberhentian: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_pengangkatan_kembali_sk_pemberhentian harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_pengangkatan_kembali_sk_pemberhentian maksimal 5 MB' },
      ),
    dok_pengangkatan_kembali_daftar_penilaian: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_pengangkatan_kembali_daftar_penilaian harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_pengangkatan_kembali_daftar_penilaian maksimal 5 MB' },
      ),
    dok_pengangkatan_kembali_sk_penilaian: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_pengangkatan_kembali_sk_penilaian harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_pengangkatan_kembali_sk_penilaian maksimal 5 MB' },
      ),
    pengangkatan_kembali_pas_foto: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file ||
          file.mimetype === 'jpeg' ||
          file.mimetype === 'png' ||
          file.mimetype === 'jpg' ||
          file.mimetype === 'image/jpeg' ||
          file.mimetype === 'image/png' ||
          file.mimetype === 'image/jpg',
        { message: 'pengangkatan_kembali_pas_foto harus berupa JPEG/PNG/JPG' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        {
          message: 'Ukuran pengangkatan_kembali_pas_foto maksimal 5 MB',
        },
      ),
  });

}
