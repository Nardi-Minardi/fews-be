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
import { CmsDasService } from './das.service';

@ApiTags('CMS/Das Management')
@Controller('cms/das')
export class CmsDasController {
  constructor(private readonly cmsDasService: CmsDasService) {}

  @Get('/')
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiOperation({
    summary: 'Get All DAS',
    description: 'Retrieve a list of all DAS with optional filters',
  })
  @HttpCode(HttpStatus.OK)
  async getAllDas(
    @Query('instansi_id') instansi_id: string,
    @Query('search') search?: string,
    @Query('offset') offset = '0',
    @Query('limit') limit = '50',
    @Query('order_by') orderBy?: string,
    @Query('order_direction') orderDirection?: 'asc' | 'desc',
    @Req() req?: ExpressRequest,
    @Headers() headers?: Record<string, any>,
  ) {
     //get from cookie or authorization header
    const token =
      req?.cookies?.auth_token ||
      headers?.['authorization']?.replace('Bearer ', '') ||
      '';

    const userLogin = await getUserFromToken(token);

    const offsetNum = Math.max(parseInt(offset || '0', 10), 0);
    const limitNum = Math.min(Math.max(parseInt(limit || '50', 10), 1), 200);

    const { data: result, total } = await this.cmsDasService.getDas({
      search,
      limit: limitNum,
      offset: offsetNum,
      orderBy,
      orderDirection,
      instansi_id: instansi_id
        ? parseInt(instansi_id, 10)
        : (userLogin as any)?.instansi_id || undefined,
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
