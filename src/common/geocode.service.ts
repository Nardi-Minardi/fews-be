import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

type ReverseResult = {
  province?: string;
  kabKota?: string;
  kecamatan?: string;
  kelDes?: string;
};

@Injectable()
export class GeocodeService {
  constructor(private readonly redisService: RedisService) {}

  private cacheKey(lat: number, lon: number) {
    return `geocode:${lat.toFixed(6)}:${lon.toFixed(6)}`;
  }

  async reverse(lat: number, lon: number): Promise<ReverseResult> {
    const key = this.cacheKey(lat, lon);

    // 🔹 1. Cek cache dulu di Redis
    const cached = await this.redisService.get(key);
    if (cached) {
      console.log(`[GeocodeService] Cache hit for ${key}`);
      return JSON.parse(cached);
    }

    try {
      // 🔹 2. Fetch dari API Nominatim
      const url = new URL('https://nominatim.openstreetmap.org/reverse');
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('lat', String(lat));
      url.searchParams.set('lon', String(lon));
      url.searchParams.set('zoom', '18'); // lebih detail
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('accept-language', 'id'); // hasil bahasa Indonesia

      const res = await fetch(url.toString(), {
        headers: { 'User-Agent': 'FEWS/1.0 (reverse-geocode)' },
      });

      if (!res.ok) {
        console.warn(`[GeocodeService] Reverse geocode failed: ${res.status}`);
        return {};
      }

      const data: any = await res.json();

      const addr = data?.address || {};
      const province = addr.state || addr.region || addr.province || undefined;
      const kabKota =
        addr.regency ||
        addr.county ||
        addr.city ||
        addr.town ||
        addr.municipality ||
        undefined;
      const kecamatan =
        addr.city_district ||
        addr.district ||
        addr.suburb ||
        addr.village_district ||
        addr.hamlet ||
        undefined;
      const kelDes = addr.village || addr.hamlet || addr.locality || undefined;

      const result = { province, kabKota, kecamatan, kelDes };

      // 🔹 3. Simpan hasil ke Redis (TTL 30 hari)
      await this.redisService.set(key, JSON.stringify(result), 60 * 60 * 24 * 30);
      console.log(`[GeocodeService] Cache saved for ${key}`);

      return result;
    } catch (err) {
      console.error('Reverse geocode failed:', err);
      return {};
    }
  }
}
