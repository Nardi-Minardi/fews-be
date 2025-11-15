import { PrismaClient } from '../node_modules/.prisma/main-client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type SeedUser = {
  username: string;
  email: string;
  password: string; // plain, will be hashed
  full_name: string;
  jabatan: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'OPERATOR' | 'USER';
  instansi_id?: number | null;
  wilayah_kerja: string[];
  is_active?: boolean;
};

const USERS: SeedUser[] = [
  {
    username: 'superadmin',
    email: 'superadmin@fews-cs7.id',
    password: 'superadmin123',
    full_name: 'Super Administrator CS7',
    jabatan: 'IT CS7',
    role: 'SUPERADMIN',
    instansi_id: null,
    wilayah_kerja: ['all'],
    is_active: true,
  },
  {
    username: 'admin_cimanuk_cisanggarung',
    email: 'admin_cimanuk_cisanggarung@gmail.com',
    password: 'admin123',
    full_name: 'Admin BBWS CIMANUK CISANGGARUNG',
    jabatan: 'Administrator Sistem',
    role: 'ADMIN',
    instansi_id: 1,
    wilayah_kerja: ['cirebon', 'indramayu', 'subang'],
    is_active: true,
  },
  {
    username: 'operator_cimanuk_cisanggarung',
    email: 'operator_cimanuk_cisanggarung@gmail.com',
    password: 'operator123',
    full_name: 'Operator BBWS CIMANUK CISANGGARUNG',
    jabatan: 'Operator Monitoring',
    role: 'OPERATOR',
    instansi_id: 1,
    wilayah_kerja: ['cirebon', 'indramayu', 'subang'],
    is_active: true,
  },
  {
    username: 'user_cimanuk_cisanggarung',
    email: 'user_cimanuk_cisanggarung@gmail.com',
    password: 'user123',
    full_name: 'User BBWS CIMANUK CISANGGARUNG',
    jabatan: 'Staff Pelaporan',
    role: 'USER',
    instansi_id: 1,
    wilayah_kerja: ['cirebon', 'indramayu', 'subang'],
    is_active: true,
  },
  {
    username: 'admin_pemali_juana',
    email: 'admin_pemali_juana@gmail.com',
    password: 'admin123',
    full_name: 'Admin BBWS PEMALI JUANA',
    jabatan: 'Administrator Sistem',
    role: 'ADMIN',
    instansi_id: 2,
    wilayah_kerja: ['semarang'],
    is_active: true,
  },
  {
    username: 'operator_pemali_juana',
    email: 'operator_pemali_juana@gmail.com',
    password: 'operator123',
    full_name: 'Operator BBWS PEMALI JUANA',
    jabatan: 'Operator Monitoring',
    role: 'OPERATOR',
    instansi_id: 2,
    wilayah_kerja: ['semarang'],
    is_active: true,
  },
  {
    username: 'user_pemali_juana',
    email: 'user_pemali_juana@gmail.com',
    password: 'user123',
    full_name: 'User BBWS PEMALI JUANA',
    jabatan: 'Staff Pelaporan',
    role: 'USER',
    instansi_id: 2,
    wilayah_kerja: ['semarang'],
    is_active: true,
  },
];

async function main() {
  console.log('[seed-user] starting...');

  for (const u of USERS) {
    try {
      const hashed = await bcrypt.hash(u.password, 10);
      const now = new Date();
      await prisma.m_users.upsert({
        where: { username: u.username },
        update: {
          email: u.email,
          password: hashed,
          full_name: u.full_name,
          jabatan: u.jabatan,
          role: u.role as any,
          instansi_id: u.instansi_id ?? null,
          wilayah_kerja: u.wilayah_kerja,
          is_active: u.is_active ?? true,
          updated_at: now,
        },
        create: {
          username: u.username,
          email: u.email,
          password: hashed,
          full_name: u.full_name,
          jabatan: u.jabatan,
          role: u.role as any,
          instansi_id: u.instansi_id ?? null,
          wilayah_kerja: u.wilayah_kerja,
          is_active: u.is_active ?? true,
          created_at: now,
          updated_at: now,
          last_login: null,
        },
      });
      console.log(`[seed-user] upserted ${u.username}`);
    } catch (e: any) {
      console.error(`[seed-user] failed for ${u.username}:`, e?.message || e);
    }
  }

  console.log('[seed-user] done');
}

main()
  .catch((e) => {
    console.error('[seed-user] error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
