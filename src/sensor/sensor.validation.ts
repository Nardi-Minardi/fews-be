import { z, ZodError } from 'zod';
import dayjs from 'dayjs';

export class SensorValidation {
  static postTelemetrySchema = z.object({
    device_id: z.string().min(1, 'device_id harus diisi'),
    name: z.string().min(1, 'name harus diisi'),
    // device_type: z.string().min(1, 'device_type harus diisi'),
    device_status: z.enum(['Online', 'Offline', 'Maintenance'], {
      message:
        'device_status harus salah satu dari: Online, Offline, Maintenance',
    }),
    timestamp: z.string().refine((val) => dayjs(val).isValid(), {
      message: 'timestamp harus dalam format ISO8601 yang valid',
    }),
    last_battery: z.number().min(0, 'last_battery harus bernilai positif'),
    last_signal: z.number().min(-150, 'last_signal harus bernilai valid dBm'),
    lat: z.number().min(-90).max(90, 'lat harus antara -90 dan 90'),
    long: z.number().min(-180).max(180, 'long harus antara -180 dan 180'),
    value: z.number(),
    cctv_url: z.string().optional(),
    hidrologi_type: z.string().optional(),
    sensors: z
      .array(
        z.object({
          sensor_id: z.string().min(1, 'sensor_id harus diisi'),
          name: z.string().min(1, 'name harus diisi'),
          unit: z.string().min(1, 'unit harus diisi'),
          sensor_type: z.string().optional(),
          value: z.number(),
          value_change: z.number().optional(),
          criteria_id: z.number().optional(),
          criteria_status: z.number().optional(),
          debit: z.number().optional(),
          elevation: z.number().optional(),
          years_data: z.array(z.number()).optional(),
        }),
      )
      .min(1, 'harus ada minimal satu sensor'),
  });
}
