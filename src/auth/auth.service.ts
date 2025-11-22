import { Injectable, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, JwtPayload, LoginResponse } from './interface/auth.interface';
import { AuthValidation } from './auth.validation';
import { ValidationService } from 'src/common/validation.service';
import { AuthRepository } from './auth.repository';
import { PrismaService } from 'src/common/prisma.service';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class AuthService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly validationService: ValidationService,
    private readonly authRepository: AuthRepository,
  ) {}

  async login(request: any): Promise<LoginResponse> {
    this.logger.info('Request login with params', { request });
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
      role_id: user.role_id,
      jabatan_id: user.jabatan_id,
      instansi_id: user.instansi_id,
    };
    const jwtSecret = process.env.JWT_SECRET || 'ItgdFVuiX2Kn7F6hLlYT';
    const jwtExpSeconds = (Number(process.env.EXPIRED_JWT_DAYS) || 1) * 24 * 60 * 60;
    const refreshExpSeconds = (Number(process.env.EXPIRED_REFRESH_DAYS) || 7) * 24 * 60 * 60;

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: jwtExpSeconds,
      secret: jwtSecret,
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, username: user.username, email: user.email },
      {
        expiresIn: refreshExpSeconds,
        secret: jwtSecret,
      },
    );

    //convert expired_in to seconds
    const expiredInSeconds = jwtExpSeconds;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expired_at: expiredInSeconds,
      user: {
        id: user.id as any,
        username: user.username,
        email: user.email,
        full_name: (user as any).full_name ?? '',
        role_id: user.role_id,
      },
    };
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
        role_id: user.role_id,
        jabatan_id: user.jabatan_id,
        instansi_id: user.instansi_id,
      };
      const jwtExp = `${process.env.EXPIRED_JWT_DAYS || 1}d`;
      const jwtExpSeconds = (Number(process.env.EXPIRED_JWT_DAYS) || 1) * 24 * 60 * 60;
      return {
        access_token: this.jwtService.sign(payload, {
          expiresIn: jwtExpSeconds,
          secret: jwtSecret,
        }),
      };
    } catch (err) {
      throw new HttpException('Invalid refresh token', 401);
    }
  }

  async getProfile(userId: number): Promise<Omit<User, 'password'>> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new HttpException('User tidak ditemukan', 404);
    }

    //get menu dan menu permissionnya
    const menus = await this.prisma.$queryRaw<any[]>`
      SELECT 
        m_menus.id,
        m_menus.title,
        m_menus.value,
        m_menus.path,
        m_menus.icon,
        m_menus.is_active,
        m_modules.id AS module_id,
        m_modules.name AS module_name,
        COALESCE(m_menu_permissions.permissions, ARRAY[]::text[]) AS permissions
      FROM m_menus
      INNER JOIN m_modules 
        ON m_menus.module_id = m_modules.id
      LEFT JOIN m_menu_permissions 
        ON m_menu_permissions.menu_id = m_menus.id
        AND m_menu_permissions.user_id = ${userId}
      WHERE m_modules.instansi_id = ${user.instansi_id}
      ORDER BY m_modules.id, m_menus.id ASC
    `;
    (user as any).menus = menus;

    return {
      id: user.id as any,
      username: user.username,
      email: user.email,
      full_name: (user as any).full_name ?? '',
      jabatan: user.m_jabatan?.name ?? '',
      role: user.m_roles?.name,
      instansi: user.m_instansi?.name ?? '',
      wilayah_kerja: user.wilayah_kerja ?? undefined,
      is_active: (user as any).is_active ?? true,
      created_at: (user as any).created_at,
      updated_at: (user as any).updated_at,
      last_login: (user as any).last_login,
      menus: (user as any).menus,
    } as any;
  }
}
