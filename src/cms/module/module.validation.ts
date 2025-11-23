import { z, ZodError } from 'zod';
import dayjs from 'dayjs';

export class CmsModuleValidation {
  static createSchema = z.object({
    instansi_id: z.number(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    is_active: z.boolean().optional().default(true),
  });

  static updateSchema = z.object({
    instansi_id: z.number().optional(),
    name: z.string().min(1, 'Name is required').optional(),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
  });
}

