import { z, ZodType } from 'zod';
import dayjs from 'dayjs';

export class PerpanjangKtpValidation {
  static readonly CREATE_PERPANJANG_KTP_PPNS: ZodType = z.object({
    id_data_ppns: z.number(),
    kartu_tanda_penyidik: z.object({
      tgl_berlaku_ktp: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          {
            message: 'Tanggal Berlaku KTP must be a valid date string',
          },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      tgl_ktp: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          {
            message: 'Tanggal KTP must be a valid date string',
          },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      no_ktp: z.string().min(1, 'No KTP is required'),
    }),
    surat_petikan: z.object({
      tgl_surat_petikan: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          {
            message: 'Tgl Surat Petikan must be a valid date string',
          },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      no_surat_petikan: z.string().min(1, 'No Surat Petikan is required'),
    }),
  });

  static readonly CREATE_PERPANJANG_KTP_UPLOAD: ZodType = z.object({
    id_surat: z.string().min(1, 'id_surat is required'),
    id_ppns: z.string().min(1, 'id_ppns is required'),
    dok_perpanjangan_ktp_sk_petikan: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_perpanjangan_ktp_sk_petikan harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_perpanjangan_ktp_sk_petikan maksimal 5 MB' },
      ),
    dok_perpanjangan_ktp_fotocopy_ktp: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_perpanjangan_ktp_fotocopy_ktp harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        {
          message: 'Ukuran dok_perpanjangan_ktp_fotocopy_ktp maksimal 5 MB',
        },
      ),
    dok_perpanjangan_ktp_berita_acara: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_perpanjangan_ktp_berita_acara harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_perpanjangan_ktp_berita_acara maksimal 5 MB' },
      ),
    perpanjangan_ktp_pas_foto: z
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
        { message: 'perpanjangan_ktp_pas_foto harus berupa JPEG/PNG/JPG' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        {
          message: 'Ukuran perpanjangan_ktp_pas_foto maksimal 5 MB',
        },
      ),
  });
}
