import { z, ZodError } from 'zod';
import dayjs from 'dayjs';

export class SensorValidation {
  static postTelemetrySchema = z.object({
    device_id: z.string().optional(),
    name: z.string().optional(),
    owner: z.string().optional(),
    hidrologi_type: z.string().optional(),
    sensors: z
      .array(
        z.object({
          sensor_id: z.string().optional(),
          device_uid: z.string().optional(),
          device_id: z.number().optional(),
          name: z.string().optional(),
          unit: z.string().optional(),
          last_sending_data: z
            .string()
            .refine((val) => dayjs(val).isValid(), {
              message:
                'last_sending_data harus dalam format ISO8601 yang valid',
            })
            .optional(),
          sensor_type: z.string().optional(),
          value: z.number().optional(),
          value_change: z.number().optional(),
          criteria_id: z.number().optional(),
          criteria_status: z.number().optional(),
          debit: z.number().optional(),
          elevation: z.number().optional(),
          years_data: z.array(z.number()).optional(),
        }),
      )
      .optional() // 🔹 sensors boleh tidak ada
      .default([]), // 🔹 kalau undefined, jadikan []
  });
}
