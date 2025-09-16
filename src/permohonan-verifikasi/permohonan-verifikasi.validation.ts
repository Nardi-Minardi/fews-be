import { z, ZodType } from 'zod';
import dayjs from 'dayjs';

export class PermohonanVerifikasiValidation {

  static readonly CREATE_VERIFIKASI_PPNS: ZodType = z.object({
    id_data_ppns: z.number(),
    masa_kerja: z.object({
      tgl_pengangkatan_sk_pns: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          {
            message: 'Tanggal Pengangkatan SK PNS must be a valid date string',
          },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      sk_kenaikan_pangkat: z.string().min(1, 'SK Kenaikan Pangkat is required'),
    }),
    pendidikan_terakhir: z.object({
      nama_sekolah: z.string().min(1, 'Nama Sekolah is required'),
      gelar_terakhir: z.string().min(1, 'Gelar Terakhir is required'),
      no_ijazah: z.string().min(1, 'No Ijazah is required'),
      tgl_ijazah: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          { message: 'Tanggal Ijazah must be a valid date string' },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
      tahun_lulus:  z.string().min(1, 'Tahun Lulus is required'),
    }),
    teknis_operasional_penegak_hukum: z.boolean(),
    jabatan: z.string().min(1, 'Jabatan is required'),
    surat_sehat_jasmani_rohani: z.object({
      nama_rs: z.string().min(1, 'Nama RS is required'),
      tgl_surat_rs: z
        .string()
        .trim()
        .refine(
          (val) => {
            if (!val) return true; // kosong → valid (nanti dicek di refine level root)
            return !isNaN(Date.parse(val));
          },
          { message: 'Tanggal Surat RS must be a valid date string' },
        )
        .transform((val) => (val ? dayjs(val).toDate() : undefined)),
    }),
    dp3: z.object({
      tahun_1: z.string().min(1, 'Tahun 1 is required'),
      nilai_1: z.number().min(0),
      tahun_2: z.string().min(1, 'Tahun 2 is required'),
      nilai_2: z.number().min(0),
    }),
  });

  static readonly CREATE_VERIFIKASI_UPLOAD: ZodType = z.object({
    id_surat: z.string().min(1, 'id_surat is required'),
    id_ppns: z.string().min(1, 'id_ppns is required'),
    dok_verifikasi_sk_masa_kerja: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_verifikasi_sk_masa_kerja harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_verifikasi_sk_masa_kerja maksimal 5 MB' },
      ),
    dok_verifikasi_sk_pangkat: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_verifikasi_sk_pangkat harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_verifikasi_sk_pangkat maksimal 5 MB' },
      ),
    dok_verifikasi_ijazah: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_verifikasi_ijazah harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_verifikasi_ijazah maksimal 5 MB' },
      ),
    dok_verifikasi_sk_jabatan_teknis_oph: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_verifikasi_sk_jabatan_teknis_oph harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        {
          message: 'Ukuran dok_verifikasi_sk_jabatan_teknis_oph maksimal 5 MB',
        },
      ),
    dok_verifikasi_sehat_jasmani: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_verifikasi_sehat_jasmani harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_verifikasi_sehat_jasmani maksimal 5 MB' },
      ),
    dok_verifikasi_penilaian_pekerjaan: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_verifikasi_penilaian_pekerjaan harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_verifikasi_penilaian_pekerjaan maksimal 5 MB' },
      ),
  });
}
