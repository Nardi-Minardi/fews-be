import { SetMetadata } from '@nestjs/common';

export const REDIS_CACHE_KEY = 'REDIS_CACHE_KEY';

export const RedisCache = (prefix: string, ttl: number = 60) =>
  SetMetadata(REDIS_CACHE_KEY, { prefix, ttl });
