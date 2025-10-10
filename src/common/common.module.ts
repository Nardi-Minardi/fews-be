import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import {
  MasterPrismaService,
  PrismaService,
  UsermanPrismaService,
} from './prisma.service';
import { RedisService } from './redis.service';
import { ValidationService } from './validation.service';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ErrorFilter } from './error.filter';
import { AuthGuard } from './guards/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { S3Service } from './s3.service';

@Global()
@Module({
  imports: [
    WinstonModule.forRoot({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/app.log',
          level: process.env.LOG_LEVEL || 'info',
          tailable: true, // optional, tetap bisa dipakai
        }),
      ],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [
    PrismaService,
    MasterPrismaService,
    UsermanPrismaService,
    ValidationService,
    S3Service,
    // RedisService,
    { provide: APP_FILTER, useClass: ErrorFilter },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [
    PrismaService,
    MasterPrismaService,
    UsermanPrismaService,
    ValidationService,
    S3Service,
  ],
})
export class CommonModule {}
