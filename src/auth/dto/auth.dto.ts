import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  MinLength,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { UserRole } from '../interface/auth.interface';

export class LoginDto {
  @ApiProperty({
    example: 'admin',
    description: 'Username untuk login',
  })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'admin123',
    description: 'Password untuk login',
  })
  @IsString()
  password: string;
}

export class RegisterDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'Username unik untuk user baru',
  })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password minimal 6 karakter',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Nama lengkap user',
  })
  @IsString()
  full_name: string;

  @ApiProperty({
    example: 'Analis Data',
    description: 'Jabatan user di instansi',
  })
  @IsString()
  jabatan: string;

  @ApiProperty({
    example: 'BMKG Jawa Barat',
    description: 'Instansi tempat user bekerja',
  })
  @IsNumber()
  instansi_id: number;

  @ApiProperty({
    example: ['bandung', 'bogor'],
    description: 'Array wilayah kerja yang bisa diakses user',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  wilayah_kerja?: string[];
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token untuk mendapatkan access token baru',
  })
  @IsString()
  refresh_token: string;
}

export class UserResponseDto {
  @ApiProperty({ example: 'user-001', description: 'ID unik user' })
  id: string;

  @ApiProperty({ example: 'john_doe', description: 'Username user' })
  username: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Email user' })
  email: string;

  @ApiProperty({ example: 'John Doe', description: 'Nama lengkap user' })
  full_name: string;

  @ApiProperty({ example: 'Analis Data', description: 'Jabatan user' })
  jabatan: string;

  @ApiProperty({
    example: 'user',
    enum: UserRole,
    description: 'Role user: admin, operator, atau user',
  })
  role: UserRole;

  @ApiProperty({ example: 1, description: 'ID instansi tempat user bekerja' })
  instansi_id: number | null;

  @ApiProperty({
    example: ['bandung', 'bogor'],
    description: 'Wilayah kerja yang bisa diakses',
  })
  wilayah_kerja?: string[];

  @ApiProperty({ example: true, description: 'Status aktif user' })
  is_active: boolean;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Tanggal dibuat',
  })
  created_at: Date;

  @ApiProperty({
    example: '2024-11-01T00:00:00.000Z',
    description: 'Tanggal terakhir update',
  })
  updated_at: Date;

  @ApiProperty({
    example: '2024-11-02T07:00:00.000Z',
    description: 'Tanggal terakhir login',
  })
  last_login?: Date;
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token (berlaku 1 hari)',
  })
  access_token: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token (berlaku 7 hari)',
  })
  refresh_token: string;

  @ApiProperty({
    description: 'Data user yang berhasil login',
    type: () => UserResponseDto,
  })
  user: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: UserRole;
    jabatan: string;
    instansi_id: number | null;
    wilayah_kerja?: string[];
  };
}

export class UserStatsDto {
  @ApiProperty({ example: 10, description: 'Total jumlah user' })
  total: number;

  @ApiProperty({
    description: 'Jumlah user per role',
    example: { admin: 2, operator: 3, user: 5 },
  })
  by_role: Record<UserRole, number>;

  @ApiProperty({ example: 9, description: 'Jumlah user aktif' })
  active: number;

  @ApiProperty({ example: 1, description: 'Jumlah user tidak aktif' })
  inactive: number;
}
