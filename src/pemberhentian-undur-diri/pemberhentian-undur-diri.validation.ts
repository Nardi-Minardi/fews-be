import { z, ZodType } from 'zod';
import dayjs from 'dayjs';

export class PemberhentianUndurDiriValidation {
  static readonly CREATE_UNDUR_DIRI_PPNS: ZodType = z.object({
    id_data_ppns: z.number(),
    sk_pengangkatan_pns: z.object({
      tgl_sk_pengangkatan_pns: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          {
            message: 'Tanggal sk pengangkatan pns must be a valid date string',
          },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      no_sk_pengangkatan_pns: z
        .string()
        .min(1, 'No sk pengangkatan pns is required'),
    }),
    sk_kenaikan_pangkat: z.object({
      tgl_sk_kenaikan_pangkat: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          {
            message: 'Tanggal sk kenaikan pangkat must be a valid date string',
          },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      no_sk_kenaikan_pangkat: z
        .string()
        .min(1, 'No sk kenaikan pangkat is required'),
    }),
    ktp_ppns: z.object({
      tgl_berlaku_ktp: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          {
            message: 'Tanggal berlaku ktp must be a valid date string',
          },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      no_ktp: z.string().min(1, 'No ktp is required'),
    }),
    sk_persetujuan: z.object({
      tgl_sk_persetujuan: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          {
            message: 'Tanggal sk persetujuan must be a valid date string',
          },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      no_sk_persetujuan: z.string().min(1, 'No sk persetujuan is required'),
    }),
    sk_pemberhentian: z.object({
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
  });

  static readonly CREATE_UNDUR_DIRI_UPLOAD: ZodType = z.object({
    id_surat: z.string().min(1, 'id_surat is required'),
    id_ppns: z.string().min(1, 'id_ppns is required'),
    dok_undur_diri_keputusan_pengangkatan: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_undur_diri_keputusan_pengangkatan harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        {
          message: 'Ukuran dok_undur_diri_keputusan_pengangkatan maksimal 5 MB',
        },
      ),
    dok_undur_diri_keputusan_kenaikan_pangkat: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        {
          message: 'dok_undur_diri_keputusan_kenaikan_pangkat harus berupa PDF',
        },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        {
          message:
            'Ukuran dok_undur_diri_keputusan_kenaikan_pangkat maksimal 5 MB',
        },
      ),
    dok_undur_diri_ktp_ppns: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_undur_diri_ktp_ppns harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_undur_diri_ktp_ppns maksimal 5 MB' },
      ),
    dok_undur_diri_surat_persetujuan: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_undur_diri_surat_persetujuan harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_undur_diri_surat_persetujuan maksimal 5 MB' },
      ),
    dok_undur_diri_surat_permohonan: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_undur_diri_surat_permohonan harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_undur_diri_surat_permohonan maksimal 5 MB' },
      ),
  });
}
