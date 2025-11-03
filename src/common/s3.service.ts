import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { Injectable, OnModuleInit, Logger, ServiceUnavailableException } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service implements OnModuleInit {
  private s3: S3Client;
  private readonly bucket = process.env.S3_BUCKET;
  private readonly endpoint = process.env.S3_ENDPOINT;
  private readonly accessKey = process.env.S3_ACCESS_KEY ?? '';
  private readonly secretKey = process.env.S3_SECRET_KEY ?? '';
  private readonly region = process.env.S3_REGION || 'ap-southeast-3';
  private readonly enabledExplicit = (process.env.S3_ENABLED || '').toLowerCase() === 'true';
  private readonly logger = new Logger('S3Service');

  private get isConfigured(): boolean {
    // If explicitly enabled, require all fields; otherwise enable only when bucket+endpoint present
    if (this.enabledExplicit) {
      return !!(this.bucket && this.endpoint && this.accessKey && this.secretKey);
    }
    return !!(this.bucket && this.endpoint);
  }

  constructor() {
    if (this.isConfigured) {
      this.s3 = new S3Client({
        endpoint: this.endpoint,
        region: this.region,
        forcePathStyle: true,
        credentials: {
          accessKeyId: this.accessKey,
          secretAccessKey: this.secretKey,
        },
      });
    } else {
      // Leave s3 undefined; operations will be no-ops or throw
      this.s3 = undefined as unknown as S3Client;
      this.logger.warn('S3 is not configured. Skipping S3 client initialization.');
    }
  }

  async onModuleInit() {
    if (!this.isConfigured) return;
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  async uploadFile(file: Express.Multer.File, optKey = '') {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException('S3 is not configured');
    }
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
    if (!this.isConfigured) {
      throw new ServiceUnavailableException('S3 is not configured');
    }
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
    if (!this.isConfigured) {
      throw new ServiceUnavailableException('S3 is not configured');
    }
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
    if (!this.isConfigured) {
      throw new ServiceUnavailableException('S3 is not configured');
    }
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });
    return await getSignedUrl(this.s3, command, { expiresIn: 3600 }); // 1 hour
  }

  async deleteFile(objectKey: string): Promise<void> {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException('S3 is not configured');
    }
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
    });
    await this.s3.send(command);
  }
}
