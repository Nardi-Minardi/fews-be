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
  Put,
  Param,
  HttpException,
  Delete,
  Headers,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { getUserFromToken } from 'src/common/utils/helper.util';
import { UserRole } from 'src/common/constants/role.enum';
import { Request as ExpressRequest } from 'express';
import { CmsSensorService } from './sensor.service';

@ApiTags('CMS/Sensor Management')
@Controller('cms/sensor')
export class CmsSensorController {
  constructor(private readonly cmsSensorService: CmsSensorService) {}

  @Get('/log')
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiOperation({
    summary: 'Get All Sensor Logs',
    description: 'Retrieve a list of all devices with optional filters',
  })
  @HttpCode(HttpStatus.OK)
  async getAllSensorLog(
    @Query('instansi_id') instansi_id: string,
    @Query('search') search?: string,
    @Query('offset') offset = '0',
    @Query('limit') limit = '50',
    @Query('order_by') orderBy?: string,
    @Query('order_direction') orderDirection?: 'asc' | 'desc',
    @Req() req?: ExpressRequest,
    @Headers() headers?: Record<string, any>,
  ) {
    const token =
      req?.cookies?.auth_token ||
      headers?.['authorization']?.replace('Bearer ', '') ||
      '';

    const userLogin = await getUserFromToken(token);

    const offsetNum = Math.max(parseInt(offset || '0', 10), 0);
    const limitNum = Math.min(Math.max(parseInt(limit || '50', 10), 1), 200);

    const { data: result, total } = await this.cmsSensorService.getSensorLog({
      instansi_id: instansi_id
        ? parseInt(instansi_id, 10)
        : (userLogin as any)?.instansi_id || undefined,
      search,
      limit: limitNum,
      offset: offsetNum,
      orderBy,
      orderDirection,
    });

    return {
      status_code: 200,
      message: 'success',
      limit: limitNum,
      offset: offsetNum,
      total_data: total,
      data: result,
    };
  }
}
