import { Module } from '@nestjs/common';
import { CmsUserController } from './user.controller';
import { CmsUserService } from './user.service';
import { CmsUserRepository } from './user.repository';
@Module({
  controllers: [CmsUserController],
  providers: [CmsUserService, CmsUserRepository],
  exports: [],
})
export class CmsUserModule {}
