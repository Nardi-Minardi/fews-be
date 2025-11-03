import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RolesGuard, RequirePermission } from '../common/guards/roles.guard';
import { UserRole, AuthRequest } from './interface/auth.interface';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { LoginResponseDto, UserResponseDto } from './dto/auth.dto';
import { WebResponse } from 'src/common/web.response';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User Login',
    description:
      'Login dengan username dan password untuk mendapatkan JWT token',
  })
  @ApiBody({
    description: 'Login payload',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@fews.go.id' },
        password: { type: 'string', example: 'password123' },
      },
      required: ['email', 'password'],
    },
  })
  async login(@Body() body: any): Promise<WebResponse<LoginResponseDto>> {
    const request = {
      ...body,
    };

    const result = await this.authService.login(request);

    return { status_code: HttpStatus.OK, message: 'Success', data: result };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Public()
  @ApiOperation({
    summary: 'Register New User',
    description: 'Registrasi user baru (default role: user)',
  })
  @ApiBody({
    description: 'Register payload',
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'minardi_dev' },
        email: { type: 'string', example: 'minardi@example.com' },
        password: { type: 'string', example: 'securePass123' },
        full_name: { type: 'string', example: 'Minardi Pratama' },
        jabatan: { type: 'string', example: 'Engineer' },
        instansi: { type: 'string', example: 'Dinas SDA Jawa Barat' },
        wilayah_kerja: {
          type: 'array',
          items: { type: 'string', example: 'Citarum Hulu' },
          example: ['Citarum Hulu', 'Cimanuk Hilir'],
        },
      },
      required: [
        'username',
        'email',
        'password',
        'full_name',
        'jabatan',
        'instansi',
      ],
    },
  })
  async register(
    @Body() registerDto: any,
  ): Promise<WebResponse<UserResponseDto>> {
    const result = await this.authService.register(registerDto);
    return {
      status_code: HttpStatus.CREATED,
      message: 'Created',
      data: result,
    };
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh Access Token',
    description: 'Mendapatkan access token baru menggunakan refresh token',
  })
  @ApiBody({
    description: 'Refresh access token using refresh_token',
    schema: {
      type: 'object',
      properties: {
        refresh_token: {
          type: 'string',
          example:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh_token_sample_value',
        },
      },
      required: ['refresh_token'],
    },
  })
  async refresh(
    @Body() refreshDto: any,
  ): Promise<WebResponse<{ access_token: string }>> {
    const result = await this.authService.refreshToken(refreshDto);
    return { status_code: HttpStatus.OK, message: 'Success', data: result };
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get User Profile',
    description: 'Mendapatkan profil user yang sedang login',
  })
  async getProfile(
    @Request() req: AuthRequest,
  ): Promise<WebResponse<UserResponseDto>> {
    const result = await this.authService.getProfile(req.user.sub);
    return { status_code: HttpStatus.OK, message: 'Success', data: result };
  }

  @Get('users')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  @RequirePermission('users', 'read')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get All Users',
    description: 'Mendapatkan daftar semua user (hanya admin dan operator)',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    description: 'Filter berdasarkan role user',
  })
  async getAllUsers(@Query('role') role?: UserRole) {
    let users;
    if (role) {
      users = await this.authService.getUsersByRole(role);
    } else {
      users = await this.authService.getAllUsers();
    }

    return {
      status_code: HttpStatus.OK,
      message: 'Success',
      data: users,
    };
  }
}
