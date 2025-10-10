import { z, ZodType } from 'zod';

export class DataMasterValidation {
  static readonly SEARCH_NOTARIS_PENGGANTI: ZodType = z.object({
    nama: z.optional(z.string().trim().default('')),
  });

  static readonly GET_DATA_MASTER: ZodType = z.object({
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

  static readonly GET_DATA_MASTER_WITHOUT_PAGINATION: ZodType = z.object({
    search: z.string().optional(),
    page: z.preprocess(
      (val) => (typeof val === 'string' ? Number(val) : val),
      z.number().optional(),
    ),
    limit: z.preprocess(
      (val) => (typeof val === 'string' ? Number(val) : val),
      z.number().optional(),
    ),
    orderBy: z.string().optional(),
    orderDirection: z.enum(['asc', 'desc']).optional(),
    filters: z.record(z.any()).optional(),
  });

  static readonly GET_DATA_PPNS_BY_NIP: ZodType = z.object({
    nip: z.string().min(1, 'NIP is required'),
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
  });
}
