import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service implements OnModuleInit {
  private s3: S3Client;
  private readonly bucket = process.env.S3_BUCKET;

  constructor() {
    this.s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: 'ap-southeast-3',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY ?? '',
        secretAccessKey: process.env.S3_SECRET_KEY ?? '',
      },
    });
  }

  async onModuleInit() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  async uploadFile(file: Express.Multer.File, optKey = '') {
    const fileName = `${Date.now()}-${file.originalname}`;
    const objectKey = `ppns/${optKey}${fileName}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return objectKey;
  }

  async uploadBuffer(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    optKey = '',
  ) {

    const objectKey = `ppns/${optKey}${fileName}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: mimeType,
      }),
    );
    return objectKey;
  }

  async moveFile(oldKey: string, newKey: string): Promise<void> {
    // Copy the file
    await this.s3.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${oldKey}`,
        Key: newKey,
      }),
    );

    // Delete the original
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: oldKey,
      }),
    );
  }

  async getFileUrl(objectKey: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });
    return await getSignedUrl(this.s3, command, { expiresIn: 3600 }); // 1 hour
  }

  async deleteFile(objectKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: objectKey,
    });

    await this.s3.send(command);
  }
}
