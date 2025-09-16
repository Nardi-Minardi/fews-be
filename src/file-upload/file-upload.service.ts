import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { promisify } from 'util';
import { exec } from 'child_process';
import * as fs from 'fs';
import { S3Service } from 'src/common/s3.service';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { status_upload_ii } from '.prisma/main-client';
import { PpnsUploadDto } from './dto/upload.dto';

@Injectable()
export class FileUploadService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private s3Service: S3Service,
  ) {}

  private async compressPdf(inputPath: string, outputPath: string) {
    const cmd = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen \
        -dColorImageDownsampleType=/Bicubic \
        -dColorImageResolution=72 -dGrayImageResolution=72 -dMonoImageResolution=72 \
        -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${outputPath} ${inputPath}`;

    const execAsync = promisify(exec);
    await execAsync(cmd);
  }

  async handleUpload(
    file: Express.Multer.File,
    folder: string,
    idTransaksi: number,
    idPpns: number | null,
    namaLayanan: string,
    idMasterFile: number | null,
    fileType: string,
    status: status_upload_ii,
  ): Promise<PpnsUploadDto> {

    let fileBuffer: Buffer = file.buffer;

    // compress jika file > 2 MB
    if (file.size > 2 * 1024 * 1024) {
      const tmpInput = `/tmp/${Date.now()}-${file.originalname}`;
      const tmpOutput = `/tmp/compressed-${Date.now()}-${file.originalname}`;

      fs.writeFileSync(tmpInput, file.buffer);
      await this.compressPdf(tmpInput, tmpOutput);
      fileBuffer = fs.readFileSync(tmpOutput);

      fs.unlinkSync(tmpInput);
      fs.unlinkSync(tmpOutput);
    }

    // simpan ke S3
    const optKey = `${folder}/${idTransaksi}/`;
    const fileName = `${namaLayanan}-${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    const objectKey = await this.s3Service.uploadBuffer(
      fileBuffer,
      fileName,
      file.mimetype,
      optKey,
    );

    return {
      id_surat: idTransaksi,
      id_ppns: idPpns ? idPpns : null,
      file_type: fileType,
      original_name: file.originalname,
      keterangan: '',
      s3_key: objectKey,
      mime_type: file.mimetype,
      file_size: file.size,
      master_file_id: idMasterFile,
      status,
    };
  }
}
