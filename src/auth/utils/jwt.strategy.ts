import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interface/auth.interface';
import { UserRepository } from '../../data/users.data';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'ItgdFVuiX2Kn7F6hLlYT',
    });
  }

  async validate(payload: JwtPayload) {
    // Verify user still exists and is active
    const user = await UserRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      return null;
    }

    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      jabatan: payload.jabatan,
      instansi: payload.instansi,
      wilayah_kerja: payload.wilayah_kerja,
    } as any;
  }
}
