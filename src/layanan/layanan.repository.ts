import { Injectable } from '@nestjs/common';
import { PpnsLayanan } from '.prisma/main-client';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class LayananRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findLayananByNama(namaLayanan: string): Promise<PpnsLayanan | null> {
    return this.prismaService.ppnsLayanan.findFirst({
      where: { nama: namaLayanan },
    });
  }

  async findLayananById(id: number): Promise<PpnsLayanan | null> {
    return this.prismaService.ppnsLayanan.findFirst({
      where: { id: id },
    });
  }
}
