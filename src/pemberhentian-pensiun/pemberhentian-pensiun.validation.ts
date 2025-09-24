import { z, ZodType } from 'zod';
import dayjs from 'dayjs';

export class PemberhentianPensiunValidation {
  static readonly CREATE_PENSIUN_PPNS: ZodType = z.object({
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
    sk_bkn: z.object({
      tgl_sk_bkn: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          {
            message: 'Tanggal sk bkn must be a valid date string',
          },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      no_sk_bkn: z.string().min(1, 'No sk bkn is required'),
    }),
  });

  static readonly CREATE_PENSIUN_UPLOAD: ZodType = z.object({
    id_surat: z.string().min(1, 'id_surat is required'),
    id_ppns: z.string().min(1, 'id_ppns is required'),
    dok_pensiun_keputusan_pengangkatan: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_pensiun_keputusan_pengangkatan harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        {
          message: 'Ukuran dok_pensiun_keputusan_pengangkatan maksimal 5 MB',
        },
      ),
    dok_pensiun_keputusan_kenaikan: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        {
          message: 'dok_pensiun_keputusan_kenaikan harus berupa PDF',
        },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        {
          message:
            'Ukuran dok_pensiun_keputusan_kenaikan maksimal 5 MB',
        },
      ),
    dok_pensiun_ktp_ppns: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_pensiun_ktp_ppns harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_pensiun_ktp_ppns maksimal 5 MB' },
      ),
    dok_pensiun_sk_bkn: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_pensiun_sk_bkn harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_pensiun_sk_bkn maksimal 5 MB' },
      ),
  });
}
