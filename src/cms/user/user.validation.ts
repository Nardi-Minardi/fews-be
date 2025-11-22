import { z, ZodError } from 'zod';
import dayjs from 'dayjs';

export class CmsUserValidation {
  static createSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters long'),
    email: z.string().email('Email is invalid'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    full_name: z.string().min(1, 'Full name is required'),
    role_id: z.number().int().positive('Role ID must be a positive integer'),
    wilayah_kerja: z.array(z.string()).optional(),
    instansi_id: z.number().int().positive().optional(),
    jabatan_id: z.number().int().positive().optional(),
  });

  static updateSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters long').optional(),
    email: z.string().email('Email is invalid').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters long').optional(),  
    full_name: z.string().min(1, 'Full name is required').optional(),
    role_id: z.number().int().positive('Role ID must be a positive integer').optional(),
    wilayah_kerja: z.array(z.string()).optional(),
    instansi_id: z.number().int().positive().optional(),
    jabatan_id: z.number().int().positive().optional(),
  });

}

