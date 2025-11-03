import {
  Injectable,
  HttpException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  User,
  JwtPayload,
  LoginResponse,
  UserRole,
} from './interface/auth.interface';
import {
  AuthValidation,
} from './auth.validation';
import { UserRepository, StoredUser } from '../data/users.data';
import { ValidationService } from 'src/common/validation.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly validationService: ValidationService,
  ) {}

  async login(request: any): Promise<LoginResponse> {
    // schema validation
    const createRequest = this.validationService.validate(
      AuthValidation.loginSchema,
      request,
    );
    const user = await UserRepository.findByUsername(createRequest.email);
    if (!user) {
      throw new HttpException('Invalid username or password', 401);
    }
    const match = await bcrypt.compare(createRequest.password, user.password);
    if (!match) {
      throw new HttpException('Invalid username or password', 401);
    }
    if (!user.isActive) {
      throw new HttpException('User account is disabled', 400);
    }

    await UserRepository.updateLastLogin(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      jabatan: user.jabatan,
      instansi: user.instansi,
      wilayah_kerja: user.wilayahKerja,
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
        full_name: user.fullName,
        role: user.role,
        jabatan: user.jabatan,
        instansi: user.instansi,
        wilayah_kerja: user.wilayahKerja,
      },
    };
  }

  async register(request: any): Promise<Omit<User, 'password'>> {
    const createRequest = this.validationService.validate(
      AuthValidation.registerSchema,
      request,
    );

    const existingUser = await UserRepository.findByUsername(
      createRequest.username,
    );
    if (existingUser) {
      throw new HttpException('Username already exists', 400);
    }
    const existingEmail = await UserRepository.findByEmail(createRequest.email);
    if (existingEmail) {
      throw new HttpException('Email already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(createRequest.password, 10);
    const newUser = await UserRepository.createUser({
      username: createRequest.username,
      email: createRequest.email,
      password: hashedPassword,
      fullName: createRequest.full_name,
      jabatan: createRequest.jabatan,
      role: UserRole.USER,
      instansi: createRequest.instansi,
      wilayahKerja: createRequest.wilayah_kerja,
      isActive: true,
    });
    const { password: _pwd, ...u } = newUser;
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      full_name: u.fullName,
      jabatan: u.jabatan,
      role: u.role,
      instansi: u.instansi,
      wilayah_kerja: u.wilayahKerja,
      is_active: u.isActive,
      created_at: u.createdAt,
      updated_at: u.updatedAt,
      last_login: u.lastLogin,
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
      const user = await UserRepository.findById(decoded.sub);
      if (!user || !user.isActive) {
        throw new HttpException('Invalid refresh token', 401);
      }
      const payload: JwtPayload = {
        sub: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        jabatan: user.jabatan,
        instansi: user.instansi,
        wilayah_kerja: user.wilayahKerja,
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

  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    const { password, ...profile } = user as StoredUser;
    return {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      full_name: profile.fullName,
      jabatan: profile.jabatan,
      role: profile.role,
      instansi: profile.instansi,
      wilayah_kerja: profile.wilayahKerja,
      is_active: profile.isActive,
      created_at: profile.createdAt,
      updated_at: profile.updatedAt,
      last_login: profile.lastLogin,
    } as any;
  }

  async getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await UserRepository.findAll();
    return users.map((u) => {
      const { password: _pwd, ...user } = u;
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.fullName,
        jabatan: user.jabatan,
        role: user.role,
        instansi: user.instansi,
        wilayah_kerja: user.wilayahKerja,
        is_active: user.isActive,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
        last_login: user.lastLogin,
      } as any;
    });
  }

  async getUsersByRole(role: UserRole): Promise<Omit<User, 'password'>[]> {
    const users = await UserRepository.findAll();
    return users
      .filter((u) => u.role === role)
      .map((u) => {
        const { password: _pwd, ...user } = u;
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.fullName,
          jabatan: user.jabatan,
          role: user.role,
          instansi: user.instansi,
          wilayah_kerja: user.wilayahKerja,
          is_active: user.isActive,
          created_at: user.createdAt,
          updated_at: user.updatedAt,
          last_login: user.lastLogin,
        } as any;
      });
  }
}
