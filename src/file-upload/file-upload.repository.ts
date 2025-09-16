import { Injectable } from '@nestjs/common';
import { PpnsTypeFile, PpnsUpload, Prisma } from '.prisma/main-client';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class FileUploadRepository {
  constructor(private readonly prismaService: PrismaService) {}

  createPpnsUpload(data: Prisma.PpnsUploadCreateInput): Promise<PpnsUpload> {
    return this.prismaService.ppnsUpload.create({ data });
  }

  updatePpnsUpload(id: number, data: Partial<PpnsUpload>): Promise<PpnsUpload> {
    return this.prismaService.ppnsUpload.update({
      where: { id: id },
      data,
    });
  }

  getMasterPpnsUploadByIdByName(nama: string): Promise<PpnsTypeFile | null> {
    return this.prismaService.ppnsTypeFile.findFirst({
      where: { nama },
    });
  }

  findFilePpnsUpload(
    file_type: string,
    id_surat: number,
    id_ppns: number,
  ): Promise<PpnsUpload[]> {
    return this.prismaService.ppnsUpload.findMany({
      where: {
        file_type,
        id_surat: Number(id_surat),
        id_data_ppns: Number(id_ppns),
      },
    });
  }
}
