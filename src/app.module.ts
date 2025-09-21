import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DataMasterModule } from './data-master/data-master.module';
import { PermohonanVerifikasiModule } from './permohonan-verifikasi/permohonan-verifikasi.module';
import { SuratModule } from './surat/surat.module';
import { PengangkatanModule } from './pengangkatan/pengangkatan.module';
import { PelantikanModule } from './pelantikan/pelantikan.module';
import { MutasiModule } from './mutasi/mutasi.module';
import { PengangkatanKembaliModule } from './pengangkatan-kembali/pengangkatan-kembali.module';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    UserModule,
    DataMasterModule,
    SuratModule,
    PermohonanVerifikasiModule,
    PengangkatanModule,
    PelantikanModule,
    MutasiModule,
    PengangkatanKembaliModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
