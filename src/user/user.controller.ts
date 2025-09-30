import { BadRequestException, Controller, Inject } from '@nestjs/common';
import { Get, HttpCode, Headers } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';
import { getUserFromToken } from 'src/common/utils/helper.util';
import { WebResponse } from 'src/common/web.response';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('User')
@Controller('/user')
export class UserController {
  constructor(
    private userService: UserService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Get('/profile')
  @ApiOperation({ summary: 'Get User Profile' })
  @HttpCode(200)
  async getProfile(
    @Headers() headers: Record<string, any>,
  ): Promise<WebResponse<UserDto>> {
    const authorization = headers['authorization'] || '';

    // gunakan this.logger
    this.logger.debug(`Authorization Header: ${authorization}`);

    const userLogin = await getUserFromToken(authorization);

    // gunakan this.logger
    this.logger.debug(`User Login: ${JSON.stringify(userLogin)}`);

    if (!userLogin) {
      throw new BadRequestException('Authorization is missing');
    }

    const request = {
      userId: Number(userLogin.user_id),
    };

    const result = await this.userService.getUserById(request);
    return {
      statusCode: 200,
      message: 'Success',
      data: result,
    };
  }
}
