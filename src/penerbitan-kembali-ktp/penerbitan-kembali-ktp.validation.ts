import { z, ZodType } from 'zod';
import dayjs from 'dayjs';

export class PenerbitanKembaliKtpValidation { 
  static readonly CREATE_PENERBITAN_KEMBALI_KTP_UPLOAD: ZodType = z.object({
    id_surat: z.string().min(1, 'id_surat is required'),
    id_ppns: z.string().min(1, 'id_ppns is required'),
    dok_penerbitan_kembali_ktp_surat_kehilangan: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_penerbitan_kembali_ktp_surat_kehilangan harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_penerbitan_kembali_ktp_surat_kehilangan maksimal 5 MB' },
      ),
    dok_penerbitan_kembali_ktp_ktp_rusak: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_penerbitan_kembali_ktp_ktp_rusak harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        {
          message: 'Ukuran dok_penerbitan_kembali_ktp_ktp_rusak maksimal 5 MB',
        },
      ),
    penerbitan_kembali_ktp_pas_foto: z
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
        { message: 'penerbitan_kembali_ktp_pas_foto harus berupa JPEG/PNG/JPG' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        {
          message: 'Ukuran penerbitan_kembali_ktp_pas_foto maksimal 5 MB',
        },
      ),
  });
}
