import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '.prisma/main-client';
import { PrismaClient as MasterPrismaClient } from '.prisma/master-client';
import { PrismaClient as UsermanPrismaClient } from '.prisma/userman-client';
import { PrismaClient as NotarisPrismaClient } from '.prisma/notaris-client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    super({
      log: [
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'query',
        },
      ],
    });
  }

  onModuleInit() {
    process.on('info', (e) => {
      this.logger.info(e);
    });
    process.on('warn', (e) => {
      this.logger.warn(e);
    });
    process.on('error', (e) => {
      this.logger.error(e);
    });
    process.on('query', (e) => {
      this.logger.info(e);
    });
  }
}

@Injectable()
export class MasterPrismaService
  extends MasterPrismaClient
  implements OnModuleInit
{
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    super({
      log: [
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'query',
        },
      ],
    });
  }

  onModuleInit() {
    process.on('info', (e) => {
      this.logger.info(e);
    });
    process.on('warn', (e) => {
      this.logger.warn(e);
    });
    process.on('error', (e) => {
      this.logger.error(e);
    });
    process.on('query', (e) => {
      this.logger.info(e);
    });
  }
}

@Injectable()
export class UsermanPrismaService
  extends UsermanPrismaClient
  implements OnModuleInit
{
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    super({
      log: [
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'query',
        },
      ],
    });
  }

  onModuleInit() {
    process.on('info', (e) => {
      this.logger.info(e);
    });
    process.on('warn', (e) => {
      this.logger.warn(e);
    });
    process.on('error', (e) => {
      this.logger.error(e);
    });
    process.on('query', (e) => {
      this.logger.info(e);
    });
  }
}

@Injectable()
export class NotarisPrismaService
  extends NotarisPrismaClient
  implements OnModuleInit
{
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    super({
      log: [
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'query',
        },
      ],
    });
  }

  onModuleInit() {
    process.on('info', (e) => {
      this.logger.info(e);
    });
    process.on('warn', (e) => {
      this.logger.warn(e);
    });
    process.on('error', (e) => {
      this.logger.error(e);
    });
    process.on('query', (e) => {
      this.logger.info(e);
    });
  }
}
