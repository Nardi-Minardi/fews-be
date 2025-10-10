import { Module } from '@nestjs/common';
import { LayananRepository } from './layanan.repository';

@Module({
  controllers: [],
  providers: [LayananRepository],
})
export class LayananModule {}
