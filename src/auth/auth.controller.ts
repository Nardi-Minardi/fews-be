import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginResponseDto } from './dto/login.dto';
import { WebResponse } from 'src/common/web.response';
import { Public } from 'src/common/decorators/public.decorator';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login' })
  @ApiBody({
    description: 'Request body untuk login',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'test10' },
        password: { type: 'string', example: 'rahasia123' },
      },
      required: ['email', 'password'],
    },
  })
  @HttpCode(200)
  async login(@Body() request: any): Promise<WebResponse<LoginResponseDto>> {
    const result = await this.authService.login(request);
    return {
      statusCode: 200,
      message: 'Login success',
      data: result,
    };
  }
}
