import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './utils/jwt.strategy';
import { AuthRepository } from './auth.repository';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [PassportModule, JwtModule, CommonModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AuthRepository],
  exports: [],
})
export class AuthModule {}
