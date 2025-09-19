import { z, ZodType } from 'zod';
import dayjs from 'dayjs';

export class SuratValidation {
  static readonly GET_SURAT_PAGINATION: ZodType = z.object({
    layanan: z.enum(
      [
        'verifikasi',
        'pengangkatan',
        'pelantikan',
        'mutasi',
        'pengangkatan kembali',
        'perpanjang ktp',
        'penerbitan kembali ktp',
        'undur diri',
        'pensiun',
        'pemberhentian NTO',
      ],
      {
        message:
          'Layanan must be one of (verifikasi, pengangkatan, pelantikan, mutasi, pengangkatan kembali, perpanjang ktp, penerbitan kembali ktp, undur diri, pensiun, pemberhentian NTO)',
      },
    ),
    search: z.string().optional(),
    page: z.preprocess(
      (val) => (typeof val === 'string' ? Number(val) : val),
      z.number(),
    ),
    limit: z.preprocess(
      (val) => (typeof val === 'string' ? Number(val) : val),
      z.number(),
    ),
    orderBy: z.string().optional(),
    orderDirection: z.enum(['asc', 'desc']).optional(),
    filters: z.record(z.any()).optional(),
  });

  static readonly CREATE_SURAT: ZodType = z.object({
    no_surat: z.string().min(1, 'No Surat is required'),
    layanan: z.enum(
      [
        'verifikasi',
        'pengangkatan',
        'pelantikan',
        'mutasi',
        'pengangkatan kembali',
        'perpanjang ktp',
        'penerbitan kembali ktp',
        'undur diri',
        'pensiun',
        'pemberhentian NTO',
      ],
      {
        message:
          'Layanan must be one of (verifikasi, pengangkatan, pelantikan, mutasi, pengangkatan kembali, perpanjang ktp, penerbitan kembali ktp, undur diri, pensiun, pemberhentian NTO)',
      },
    ),
    lembaga_kementerian: z.string().min(1, 'Lembaga/Kementerian is required'),
    instansi: z.string().min(1, 'Instansi is required'),
    tgl_surat: z
      .string()
      .trim()
      .refine(
        (val) => {
          if (!val) return true; // kosong → valid (nanti dicek di refine level root)
          return !isNaN(Date.parse(val));
        },
        { message: 'Tanggal Surat must be a valid date string' },
      )
      .transform((val) => (val ? dayjs(val).toDate() : undefined)),
    perihal: z.string().min(1, 'Perihal is required'),
    nama_pengusul: z.string().min(1, 'Nama Pengusul is required'),
    jabatan_pengusul: z.string().min(1, 'Jabatan Pengusul is required'),
    dok_surat_pernyataan: z
      .any()
      .optional()
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.mimetype === 'application/pdf',
        { message: 'dok_surat_pernyataan harus berupa PDF' },
      )
      .refine(
        (file: Express.Multer.File | undefined) =>
          !file || file.size <= 5 * 1024 * 1024,
        { message: 'Ukuran dok_surat_pernyataan maksimal 5 MB' },
      ),
  });

  static readonly CREATE_SEND_VERIFIKATOR: ZodType = z.object({
    id_surat: z.number(),
    // layanan: z.enum(
    //   [
    //     'verifikasi',
    //     'pengangkatan',
    //     'pelantikan',
    //     'mutasi',
    //     'pengangkatan kembali',
    //     'perpanjang ktp',
    //     'penerbitan kembali ktp',
    //     'undur diri',
    //     'pensiun',
    //     'pemberhentian NTO',
    //   ],
    //   {
    //     message:
    //       'Layanan must be one of (verifikasi, pengangkatan, pelantikan, mutasi, pengangkatan kembali, perpanjang ktp, penerbitan kembali ktp, undur diri, pensiun, pemberhentian NTO)',
    //   },
    // ),
  });

  static readonly CREATE_CALON_PPNS: ZodType = z.object({
    id_surat: z.number(),
    identitas_pns: z.object({
      nama: z.string().min(1, 'Nama is required'),
      nip: z.string().min(1, 'NIP is required'),
      nama_gelar: z.string().min(1, 'Nama Gelar is required'),
      gelar_depan: z.string().optional(),
      gelar_belakang: z.string().min(1, 'Gelar Belakang is required'),
      jabatan: z.string().min(1, 'Jabatan is required'),
      pangkat_golongan: z.string().min(1, 'Pangkat Golongan is required'),
      jenis_kelamin: z.enum(['Pria', 'Wanita'], {
        message: 'Jenis Kelamin must be Pria atau Wanita',
      }),
      nomor_hp: z.string().optional(),
      email: z
        .string()
        .email('Email must be a valid email address')
        .optional()
        .nullable(),
      agama: z.number(),
      // agama: z.enum(
      //   [
      //     'Islam',
      //     'Kristen Protestan',
      //     'Katolik',
      //     'Hindu',
      //     'Buddha',
      //     'Konghucu',
      //   ],
      //   {
      //     message:
      //       'Agama must be one of (Islam, Kristen Protestan, Katolik, Hindu, Buddha, Konghucu)',
      //   },
      // ),
    }),
    wilayah_kerja: z
      .array(
        z.object({
          provinsi: z.string().min(1, 'Provinsi is required'),
          kab_kota: z.string().min(1, 'Kabupaten/kota is required'),
          kecamatan: z.string().min(1, 'Kecamatan is required'),

          // unit_kerja: z.string().min(1, 'Unit Kerja is required'),
          // penempatan_baru: z.boolean(),
          uu_dikawal: z
            .array(z.string().min(1, 'UU Dikawal cannot be empty'))
            .min(1, 'UU Dikawal must have at least one entry')
            .max(3, 'UU Dikawal can have at most 3 entries'),
        }),
      )
      .min(1, 'Minimal harus ada 1 wilayah kerja'),
    lokasi_penempatan: z.object({
      provinsi_penempatan: z
        .string()
        .min(1, 'Provinsi Penempatan Kerja is required'),
      kabupaten_penempatan: z
        .string()
        .min(1, 'kabupaten Penempatan is required'),
      unit_kerja: z.string().min(1, 'Unit Kerja is required'),
    }),
  });

  static readonly CREATE_CALON_PPNS_STEP2: ZodType = z.object({
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
      tahun_lulus: z
        .number({ invalid_type_error: 'Tahun Lulus must be a number' })
        .int('Tahun Lulus must be an integer')
        .min(1900, 'Tahun Lulus must be at least 1900')
        .max(new Date().getFullYear(), 'Tahun Lulus cannot be in the future'),
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
      tahun_1: z.number().int().min(0),
      nilai_1: z.number().min(0),
      tahun_2: z.number().int().min(0),
      nilai_2: z.number().min(0),
    }),
  });

  static readonly CREATE_CALON_PPNS_STEP3: ZodType = z.object({
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
