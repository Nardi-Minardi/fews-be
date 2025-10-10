import { Module } from '@nestjs/common';
import { FileUploadRepository } from './file-upload.repository';
import { S3Service } from 'src/common/s3.service';

@Module({
  controllers: [],
  providers: [FileUploadRepository, S3Service],
})
export class FileUploadModule {}
