import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

// src/common/interfaces/jwt-payload.interface.ts
export interface JwtPayload {
  user_id: number;
  username: string;
  expired: number;
  iat: number;
  exp: number;
}

//cencor character
export function censorCharacter(character: string): string {
  if (character.length === 0) return character;

  return character
    .split('')
    .map((ch, i) => (i % 2 === 1 ? '*' : ch)) // sensor huruf selang-seling
    .join('');
}

// create expiredt 60 days from now
export function createExpiredDate(): Date {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 60); // Add 60 days
  return currentDate;
}

//generate 16 digit unique angka
export function generateUniqueString(prefix: string): string {
  // generate angka random 16 digit
  const randomPart = Math.floor(
    Math.random() * 10 ** 16, // 16 digit
  )
    .toString()
    .padStart(16, '0');

  return `${prefix}${randomPart}`;
}

//decode from header token jwt
export async function getUserFromToken(
  token: string,
): Promise<JwtPayload | null> {
  if (!token) return null;
  const jwtService = new JwtService({
    secret: process.env.JWT_SECRET || 'ItgdFVuiX2Kn7F6hLlYT',
  });
  try {
    const payload = await jwtService.verifyAsync<JwtPayload>(token, {
      secret: process.env.JWT_SECRET,
    });
    return payload;
  }
  catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// utils/prisma-mapper.ts
export function filterAllowedFields<T extends object>(
  data: Record<string, any>,
  allowed: (keyof T)[],
): Partial<T> {
  const filtered: Partial<T> = {};
  for (const key of allowed) {
    if (key in data) {
      filtered[key] = data[key as string];
    }
  }
  return filtered;
}

// Helper: validasi nama lengkap harus minimal 3 suku kata
export function isValidFullName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  // pecah berdasarkan spasi, hilangkan spasi kosong
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0); // asal tidak kosong

  return parts.length >= 3;
}

export function dateOnlyToLocal(dateInput: string | Date): Date | null {
  if (!dateInput) return null;

  let year: number, month: number, day: number;

  if (typeof dateInput === 'string') {
    // format "YYYY-MM-DD"
    [year, month, day] = dateInput.split('-').map(Number);
  } else if (dateInput instanceof Date) {
    // kalau sudah Date, ambil komponen lokalnya
    year = dateInput.getFullYear();
    month = dateInput.getMonth() + 1;
    day = dateInput.getDate();
  } else {
    throw new Error('Invalid date input format');
  }

  // bikin Date jam 12:00 agar aman dari pergeseran zona waktu
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function extractTokenFromHeader(request: Request): string | undefined {
  const authHeader = request.headers.authorization;
  if (!authHeader) return undefined;

  const [type, token] = authHeader.split(' ');
  return type === 'Bearer' ? token : undefined;
}
