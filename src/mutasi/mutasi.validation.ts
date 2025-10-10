import { z, ZodType } from 'zod';
import dayjs from 'dayjs';

export class MutasiValidation {
  static readonly CREATE_MUTASI_PPNS: ZodType = z.object({
    id_data_ppns: z.number(),
    surat_permohonan: z.object({
      tgl_surat: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          {
            message: 'Tanggal Surat must be a valid date string',
          },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      no_surat: z.string().min(1, 'No Surat is required'),
    }),
    surat_keputusan_pangkat: z.object({
      tgl_keputusan_pangkat: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          {
            message: 'Tgl keputusan pangkat must be a valid date string',
          },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      no_keputusan_pangkat: z
        .string()
        .min(1, 'No keputusan pangkat is required'),
    }),
    surat_keputusan_kenaikan_pangkat: z.object({
      tgl_keputusan_kenaikan_pangkat: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          {
            message:
              'Tgl Keputusan Kenaikan pangkat must be a valid date string',
          },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      no_keputusan_kenaikan_pangkat: z
        .string()
        .min(1, 'No Keputusan Kenaikan pangkat is required'),
    }),
    surat_sk_mutasi_wilayah_kerja: z.object({
      tgl_sk_mutasi_wilayah_kerja: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          {
            message: 'Tgl SK Mutasi Wilayah Kerja must be a valid date string',
          },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      no_sk_mutasi_wilayah_kerja: z
        .string()
        .min(1, 'No Sk Mutasi wilayah Kerja is required'),
    }),
  });

  static readonly CREATE_MUTASI_UPLOAD: ZodType = z.object({
    id_surat: z.string().min(1, 'id_surat is required'),
    id_ppns: z.string().min(1, 'id_ppns is required'),
    dok_mutasi_keputusan_pengangkatan: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_mutasi_keputusan_pengangkatan harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_mutasi_keputusan_pengangkatan maksimal 5 MB' },
      ),
    dok_mutasi_keputusan_kenaikan_pangkat: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_mutasi_keputusan_kenaikan_pangkat harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_mutasi_keputusan_kenaikan_pangkat maksimal 5 MB' },
      ),
    dok_mutasi_sk_mutasi: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_mutasi_sk_mutasi harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_mutasi_sk_mutasi maksimal 5 MB' },
      ),
    mutasi_pas_foto: z
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
        { message: 'mutasi_pas_foto harus berupa JPEG/PNG/JPG' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        {
          message: 'Ukuran mutasi_pas_foto maksimal 5 MB',
        },
      ),
  });
}
