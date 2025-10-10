import { z, ZodType } from 'zod';

export class UserValidation {
  static readonly USER_ID: ZodType = z.object({
    userId: z.number(),
  });
}
