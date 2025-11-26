import { z, ZodError } from 'zod';
import dayjs from 'dayjs';

export class CmsDeviceValidation {
  static createSchema = z.object({
    instansi_id: z.number(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    is_active: z.boolean().optional().default(true),
  });

  static updateSchema = z.object({
    name: z.string().min(1, 'Name is required'),
  });
}

