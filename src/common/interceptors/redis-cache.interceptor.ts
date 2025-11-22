import {
  Injectable,
  ExecutionContext,
  CallHandler,
  NestInterceptor,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { RedisService } from '../redis.service';
import { REDIS_CACHE_KEY } from '../decorators/redis-cache.decorator';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const cacheMeta = this.reflector.getAllAndOverride<{
      prefix: string;
      ttl: number;
    }>(REDIS_CACHE_KEY, [context.getHandler(), context.getClass()]);

    if (!cacheMeta) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const queryString = JSON.stringify(request.query || {});
    const cacheKey = `${cacheMeta.prefix}:${queryString}`;

    return from(this.redisService.get(cacheKey)).pipe(
      switchMap((cached) => {
        if (cached) {
          this.logger.info(`[RedisCacheInterceptor] HIT: ${cacheKey}`);
          return of(JSON.parse(cached)); // ✅ langsung kembalikan data cache ke pipeline
        } else {
          this.logger.info(`[RedisCacheInterceptor] MISS: ${cacheKey}`);
          return next.handle().pipe(
            tap(async (responseData) => {
              await this.redisService.set(
                cacheKey,
                JSON.stringify(responseData),
                cacheMeta.ttl,
              );
              this.logger.info(
                `[RedisCacheInterceptor] Stored cache: ${cacheKey} (TTL=${cacheMeta.ttl}s)`,
              );
            }),
          );
        }
      }),
    );
  }
}
