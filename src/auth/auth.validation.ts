import { z, ZodError } from 'zod';
import dayjs from 'dayjs';

export class AuthValidation {
  static loginSchema = z.object({
    email: z.string().email('Email is invalid'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  });

  static registerSchema = z
    .object({
      username: z
        .string({ required_error: 'Username is required' })
        .min(3, 'Username must be at least 3 characters long')
        .max(64, 'Username is too long'),
      email: z
        .string({ required_error: 'Email is required' })
        .email('Email is invalid'),
      password: z
        .string({ required_error: 'Password is required' })
        .min(6, 'Password must be at least 6 characters long'),
      full_name: z
        .string({ required_error: 'Full name is required' })
        .min(3, 'Full name must be at least 3 characters long'),
      jabatan: z
        .string({ required_error: 'Jabatan is required' })
        .min(2, 'Jabatan is too short'),
      instansi: z
        .string({ required_error: 'Instansi is required' })
        .min(2, 'Instansi is too short'),
      wilayah_kerja: z.array(z.string().min(1)).optional(),
    })
    .strict();

  static refreshSchema = z.object({
    refresh_token: z
      .string({ required_error: 'refresh_token is required' })
      .min(1, 'refresh_token is required'),
  });
}

