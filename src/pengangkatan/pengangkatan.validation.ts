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

export class PengangkatanValidation {
  static readonly CREATE_PENGANGKATAN_PPNS: ZodType = z.object({
      id_data_ppns: z.string().min(1, 'id_data_ppns is required'),

      nama_sekolah: z.string().min(1, 'Nama Sekolah is required'),
      gelar_terakhir: z.string().min(1, 'Gelar Terakhir is required'),
      no_ijazah: z.string().min(1, 'No Ijazah is required'),
      tgl_ijazah: z
        .string()
        .trim()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: 'Tanggal Ijazah must be a valid date string',
        })
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),

      tahun_lulus: z.string().min(1, 'Tahun Lulus is required'),
      no_sttpl: z.string().min(1, 'No STTPL is required'),
      tgl_sttpl: z
        .string()
        .trim()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: 'Tanggal STPL must be a valid date string',
        })
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      tgl_verifikasi: z
        .string()
        .trim()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: 'Tanggal Verifikasi must be a valid date string',
        })
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      teknis_operasional_penegak_hukum: zBooleanFromFormData,
      jabatan: z.string().optional(),

      // ======= SURAT POLISI =======
      cek_surat_polisi: zBooleanFromFormData,
      no_surat_polisi: z.string().optional(),
      tgl_surat_polisi: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: 'Tanggal Surat Polisi must be a valid date string',
        })
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      perihal_surat_polisi: z.string().optional(),
      no_tanda_terima_polisi: z.string().optional(),
      tgl_tanda_terima_polisi: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: 'Tanggal Tanda Terima Polisi must be a valid date string',
        })
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      perihal_tanda_terima_polisi: z.string().optional(),
      dok_tanda_terima_polisi: z
        .any()
        .optional()
        .refine(
          (file: Express.Multer.File | undefined) =>
            !file || file.mimetype === 'application/pdf',
          { message: 'dok_tanda_terima_polisi harus berupa PDF' },
        )
        .refine(
          (file: Express.Multer.File | undefined) =>
            !file || file.size <= 5 * 1024 * 1024,
          { message: 'Ukuran dok_tanda_terima_polisi maksimal 5 MB' },
        ),

      // ======= SURAT KEJAKSAAN =======
      cek_surat_kejaksaan_agung: zBooleanFromFormData,
      no_surat_kejaksaan_agung: z.string().optional(),
      tgl_surat_kejaksaan_agung: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message: 'Tanggal Surat Kejaksaan Agung must be a valid date string',
        })
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      perihal_surat_kejaksaan_agung: z.string().optional(),
      no_tanda_terima_kejaksaan_agung: z.string().optional(),
      tgl_tanda_terima_kejaksaan_agung: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
          message:
            'Tanggal Tanda Terima Kejaksaan Agung must be a valid date string',
        })
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      perihal_tanda_terima_kejaksaan_agung: z.string().optional(),
      dok_tanda_terima_kejaksaan_agung: z
        .any()
        .optional()
        .refine(
          (file: Express.Multer.File | undefined) =>
            !file || file.mimetype === 'application/pdf',
          { message: 'dok_tanda_terima_kejaksaan_agung harus berupa PDF' },
        )
        .refine(
          (file: Express.Multer.File | undefined) =>
            !file || file.size <= 5 * 1024 * 1024,
          { message: 'Ukuran dok_tanda_terima_kejaksaan_agung maksimal 5 MB' },
        ),
    })
    .superRefine((data, ctx) => {
      // ====== VALIDASI SURAT POLISI ======
      if (data.cek_surat_polisi) {
        if (!data.no_tanda_terima_polisi) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['no_tanda_terima_polisi'],
            message:
              'No Tanda Terima Polisi is required when cek_surat_polisi = false',
          });
        }
        if (!data.tgl_tanda_terima_polisi) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['tgl_tanda_terima_polisi'],
            message:
              'Tanggal Tanda Terima Polisi is required when cek_surat_polisi = false',
          });
        }
        if (!data.perihal_tanda_terima_polisi) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['perihal_tanda_terima_polisi'],
            message:
              'Perihal Tanda Terima Polisi is required when cek_surat_polisi = false',
          });
        }
        if (!data.dok_tanda_terima_polisi) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dok_tanda_terima_polisi'],
            message:
              'Dok Tanda Terima Polisi is required when cek_surat_polisi = false',
          });
        }
      } else {
        if (!data.no_surat_polisi) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['no_surat_polisi'],
            message: 'No Surat Polisi is required when cek_surat_polisi = true',
          });
        }
        if (!data.tgl_surat_polisi) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['tgl_surat_polisi'],
            message:
              'Tanggal Surat Polisi is required when cek_surat_polisi = true',
          });
        }
        if (!data.perihal_surat_polisi) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['perihal_surat_polisi'],
            message:
              'Perihal Surat Polisi is required when cek_surat_polisi = true',
          });
        }
      }

      // ====== VALIDASI SURAT KEJAKSAAN ======
      if (data.cek_surat_kejaksaan_agung) {
        if (!data.no_tanda_terima_kejaksaan_agung) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['no_tanda_terima_kejaksaan_agung'],
            message:
              'No Tanda Terima Kejaksaan Agung is required when cek_surat_kejaksaan_agung = false',
          });
        }
        if (!data.tgl_tanda_terima_kejaksaan_agung) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['tgl_tanda_terima_kejaksaan_agung'],
            message:
              'Tanggal Tanda Terima Kejaksaan Agung is required when cek_surat_kejaksaan_agung = false',
          });
        }
        if (!data.perihal_tanda_terima_kejaksaan_agung) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['perihal_tanda_terima_kejaksaan_agung'],
            message:
              'Perihal Tanda Terima Kejaksaan Agung is required when cek_surat_kejaksaan_agung = false',
          });
        }
        if (!data.dok_tanda_terima_kejaksaan_agung) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['dok_tanda_terima_kejaksaan_agung'],
            message:
              'Dok Tanda Terima Kejaksaan Agung is required when cek_surat_kejaksaan_agung = false',
          });
        }
      } else {
        if (!data.no_surat_kejaksaan_agung) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['no_surat_kejaksaan_agung'],
            message:
              'No Surat Kejaksaan Agung is required when cek_surat_kejaksaan_agung = true',
          });
        }
        if (!data.tgl_surat_kejaksaan_agung) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['tgl_surat_kejaksaan_agung'],
            message:
              'Tanggal Surat Kejaksaan Agung is required when cek_surat_kejaksaan_agung = true',
          });
        }
        if (!data.perihal_surat_kejaksaan_agung) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['perihal_surat_kejaksaan_agung'],
            message:
              'Perihal Surat Kejaksaan Agung is required when cek_surat_kejaksaan_agung = true',
          });
        }
      }
    });

  static readonly CREATE_PENGANGKATAN_UPLOAD: ZodType = z.object({
    id_surat: z.string().min(1, 'id_surat is required'),
    id_ppns: z.string().min(1, 'id_ppns is required'),
    dok_surat_permohonan_pengangkatan: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_surat_permohonan_pengangkatan harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_surat_permohonan_pengangkatan maksimal 5 MB' },
      ),
    dok_fotokopi_tamat_pendidikan: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_fotokopi_tamat_pendidikan harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_fotokopi_tamat_pendidikan maksimal 5 MB' },
      ),
    dok_surat_pertimbangan: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_surat_pertimbangan harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_surat_pertimbangan maksimal 5 MB' },
      ),
    foto: z
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
        { message: 'foto harus berupa JPEG/PNG/JPG' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        {
          message: 'Ukuran foto maksimal 5 MB',
        },
      ),
  });
}
