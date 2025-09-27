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
import { PerpanjangKtpModule } from './perpanjang-ktp/perpanjang-ktp.module';
import { PenerbitanKembaliKtpModule } from './penerbitan-kembali-ktp/penerbitan-kembali-ktp.module';
import { PemberhentianUndurDiriModule } from './pemberhentian-undur-diri/pemberhentian-undur-diri.module';
import { PemberhentianPensiunModule } from './pemberhentian-pensiun/pemberhentian-pensiun.module';
import { PemberhentianNtoModule } from './pemberhentian-nto/pemberhentian-nto.module';

@Module({
  imports: [
    CommonModule,
    SuratModule,
    PermohonanVerifikasiModule,
    PengangkatanModule,
    PelantikanModule,
    MutasiModule,
    PengangkatanKembaliModule,
    PerpanjangKtpModule,
    PenerbitanKembaliKtpModule,
    PemberhentianUndurDiriModule,
    PemberhentianPensiunModule,
    PemberhentianNtoModule,
    DataMasterModule,
    UserModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
