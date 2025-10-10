import { HttpException, Inject, Injectable, Req } from '@nestjs/common';
import {
  LoginRequestDto,
  LoginResponseDto,
} from './dto/login.dto';
import { ValidationService } from 'src/common/validation.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AuthValidation } from './auth.validation';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from 'src/user/user.repository';
import { User } from '.prisma/userman-client';

@Injectable()
export class AuthService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private validationService: ValidationService,
    private jwtService: JwtService,
    private userRepository: UserRepository,
  ) {}

  async login(request: LoginRequestDto): Promise<LoginResponseDto> {
    this.logger.debug('Logging in user', { request });
    const loginRequest: LoginRequestDto = this.validationService.validate(
      AuthValidation.LOGIN,
      request,
    );

    // Check user exists
    const user = await this.userRepository.findByEmailOrUsername(
      loginRequest.email,
    );
    if (!user) {
      throw new HttpException('User not found', 404);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(
      loginRequest.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', 401);
    }

    // Create token
    const token = await this.generateToken(user);

    return {
      email: user.email || '',
      username: user.username || '',
      fullname: user.fullname,
      accessToken: token,
    };
  }

  private async generateToken(user: User) {
    return this.jwtService.signAsync(
      { user_id: user.id,  username: user.username,  expired: Date.now() + 7 * 24 * 60 * 60 * 1000 }, // Token valid for 7 days
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d',
      },
    );
  }
}
