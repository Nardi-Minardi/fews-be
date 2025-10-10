import { z, ZodType } from 'zod';
import dayjs from 'dayjs';

const zBooleanFromFormData = z.preprocess(
  (val) => {
    if (val === undefined || val === null) return undefined;

    if (typeof val === 'string') {
      if (val.toLowerCase() === 'true') return true;
      if (val.toLowerCase() === 'false') return false;
      return val; // return saja string, biar z.boolean() di bawah yg gagal
    }

    return val;
  },
  z.boolean({ required_error: 'Value must be true or false' }),
);

export class PelantikanValidation {
  static readonly CREATE_PELANTIKAN_PPNS: ZodType = z.object({
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
    surat_ket_pengangkatan: z.object({
      tgl_sk_induk: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          {
            message: 'Tgl SK Induk must be a valid date string',
          },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      no_sk_induk: z.string().min(1, 'No SK Induk is required'),
    })
  });

  static readonly CREATE_PELANTIKAN_UPLOAD: ZodType = z.object({
    id_surat: z.string().min(1, 'id_surat is required'),
    id_ppns: z.string().min(1, 'id_ppns is required'),
    dok_pelantikan_surat_permohonan: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_pelantikan_surat_permohonan harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_pelantikan_surat_permohonan maksimal 5 MB' },
      ),
    dok_pelantikan_sk_menteri: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_pelantikan_sk_menteri harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_pelantikan_sk_menteri maksimal 5 MB' },
      ),
    dok_pelantikan_lampiran_menteri: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_pelantikan_lampiran_menteri harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_pelantikan_lampiran_menteri maksimal 5 MB' },
      ),
  });
}
