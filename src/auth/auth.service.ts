import { Injectable, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  User,
  JwtPayload,
  LoginResponse,
  UserRole,
} from './interface/auth.interface';
import { AuthValidation } from './auth.validation';
import { ValidationService } from 'src/common/validation.service';
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly validationService: ValidationService,
    private readonly authRepository: AuthRepository,
  ) {}

  async login(request: any): Promise<LoginResponse> {
    // schema validation
    const createRequest = this.validationService.validate(
      AuthValidation.loginSchema,
      request,
    );
    const user = await this.authRepository.findByEmail(createRequest.email);
    if (!user) {
      throw new HttpException('Invalid username or password', 401);
    }
    const match = await bcrypt.compare(createRequest.password, user.password);
    if (!match) {
      throw new HttpException('Invalid username or password', 401);
    }
    if (user.is_active === false) {
      throw new HttpException('User account is disabled', 400);
    }
    await this.authRepository.updateLastLogin(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role as any as UserRole,
      jabatan: user.jabatan ?? '',
      instansi_id: user.instansi_id ?? null,
      wilayah_kerja: user.wilayah_kerja ?? undefined,
    };
    const jwtSecret = process.env.JWT_SECRET || 'ItgdFVuiX2Kn7F6hLlYT';
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1d',
      secret: jwtSecret,
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, username: user.username },
      { expiresIn: '7d', secret: jwtSecret },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: (user as any).full_name ?? '',
        role: user.role as any as UserRole,
        jabatan: user.jabatan ?? '',
        instansi_id: user.instansi_id ?? null,
        wilayah_kerja: user.wilayah_kerja ?? undefined,
      },
    };
  }

  async register(request: any): Promise<Omit<User, 'password'>> {
    const createRequest = this.validationService.validate(
      AuthValidation.registerSchema,
      request,
    );

    const existingUser = await this.authRepository.findByUsername(createRequest.username);
    if (existingUser) {
      throw new HttpException('Username already exists', 400);
    }
    const existingEmail = await this.authRepository.findByEmail(createRequest.email);
    if (existingEmail) {
      throw new HttpException('Email already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(createRequest.password, 10);
    const newUser = await this.authRepository.createUser({
      username: createRequest.username,
      email: createRequest.email,
      password: hashedPassword,
      full_name: createRequest.full_name,
      jabatan: createRequest.jabatan,
      role: 'USER',
      instansi_id: createRequest.instansi_id ?? null,
      wilayah_kerja: createRequest.wilayah_kerja ?? [],
      is_active: true,
    });
    return {
      id: newUser.id as any,
      username: newUser.username,
      email: newUser.email,
      full_name: (newUser as any).full_name,
      jabatan: newUser.jabatan ?? '',
      role: newUser.role as any as UserRole,
      instansi_id: newUser.instansi_id ?? null,
      wilayah_kerja: (newUser as any).wilayah_kerja ?? [],
      is_active: (newUser as any).is_active ?? true,
      created_at: (newUser as any).created_at,
      updated_at: (newUser as any).updated_at,
      last_login: (newUser as any).last_login,
    } as any;
  }

  async refreshToken(request: any): Promise<{ access_token: string }> {
    const createRequest = this.validationService.validate(
      AuthValidation.refreshSchema,
      request,
    );

    const jwtSecret = process.env.JWT_SECRET || 'ItgdFVuiX2Kn7F6hLlYT';
    try {
      const decoded = this.jwtService.verify(createRequest.refresh_token, {
        secret: jwtSecret,
      });
      const user = await this.authRepository.findById(decoded.sub);
      if (!user || user.is_active === false) {
        throw new HttpException('Invalid refresh token', 401);
      }
      const payload: JwtPayload = {
        sub: user.id,
        username: user.username,
        email: user.email,
        role: user.role as any as UserRole,
        jabatan: user.jabatan ?? '',
        instansi_id: user.instansi_id ?? null,
        wilayah_kerja: user.wilayah_kerja ?? undefined,
      };
      return {
        access_token: this.jwtService.sign(payload, {
          expiresIn: '1d',
          secret: jwtSecret,
        }),
      };
    } catch (e) {
      throw new HttpException('Invalid refresh token', 401);
    }
  }

  async getProfile(userId: number): Promise<Omit<User, 'password'>> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    return {
      id: user.id as any,
      username: user.username,
      email: user.email,
      full_name: (user as any).full_name ?? '',
      jabatan: user.jabatan ?? '',
      role: user.role as any as UserRole,
      instansi_id: user.instansi_id ?? null,
      wilayah_kerja: user.wilayah_kerja ?? undefined,
      is_active: (user as any).is_active ?? true,
      created_at: (user as any).created_at,
      updated_at: (user as any).updated_at,
      last_login: (user as any).last_login,
    } as any;
  }

  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await this.authRepository.findAllActive();
    return users.map((u) => {
      return {
        id: u.id as any,
        username: u.username,
        email: u.email,
        full_name: (u as any).full_name ?? '',
        jabatan: u.jabatan ?? '',
        role: u.role as any as UserRole,
        instansi_id: u.instansi_id ?? null,
        wilayah_kerja: u.wilayah_kerja ?? undefined,
        is_active: (u as any).is_active ?? true,
        created_at: (u as any).created_at,
        updated_at: (u as any).updated_at,
        last_login: (u as any).last_login,
      } as any;
    });
  }

  async getUsersByRole(role: UserRole): Promise<Omit<User, 'password'>[]> {
    const users = await this.authRepository.findByRoleActive(role as any);
    return users.map(
      (u) =>
        ({
          id: u.id as any,
          username: u.username,
          email: u.email,
          full_name: (u as any).full_name ?? '',
          jabatan: u.jabatan ?? '',
          role: u.role as any as UserRole,
          instansi_id: u.instansi_id ?? null,
          wilayah_kerja: u.wilayah_kerja ?? undefined,
          is_active: (u as any).is_active ?? true,
          created_at: (u as any).created_at,
          updated_at: (u as any).updated_at,
          last_login: (u as any).last_login,
        }) as any,
    );
  }
}
