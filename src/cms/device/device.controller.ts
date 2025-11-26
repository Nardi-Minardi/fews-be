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
import { CmsDeviceService } from './device.service';

@ApiTags('CMS/Device Management')
@Controller('cms/devices')
export class CmsDeviceController {
  constructor(private readonly cmsDeviceService: CmsDeviceService) {}

  @Get('/')
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiOperation({
    summary: 'Get All Devices',
    description: 'Retrieve a list of all devices with optional filters',
  })
  @HttpCode(HttpStatus.OK)
  async getAllDevices(
    @Query('instansi_id') instansi_id: string,
    @Query('search') search?: string,
    @Query('offset') offset = '0',
    @Query('limit') limit = '50',
    @Query('order_by') orderBy?: string,
    @Query('order_direction') orderDirection?: 'asc' | 'desc',
    @Query('das_ids') dasIdsQuery?: string,
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

    let dasIds: number[] | undefined = undefined;

     if (dasIdsQuery) {
      dasIds = dasIdsQuery
        .split(',')
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id));
    }

    const { data: result, total } = await this.cmsDeviceService.getDevice({
      instansi_id: instansi_id
        ? parseInt(instansi_id, 10)
        : (userLogin as any)?.instansi_id || undefined,
      search,
      limit: limitNum,
      offset: offsetNum,
      orderBy,
      orderDirection,
      das_ids: dasIds,
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

  @Post('/')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create Device',
    description: 'Create a new device',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Module Name' },
        instansi_id: { type: 'number', example: 1 },
        is_active: { type: 'boolean', example: true },
        description: { type: 'string', example: 'Module Description' },
      },
      required: ['name', 'instansi_id'],
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async createDevice(@Body() body: any) {
    const request = {
      ...body,
    };
    const result = await this.cmsDeviceService.createModule(request);

    return {
      status_code: 201,
      message: 'Module created successfully',
      data: result,
    };
  }

  @Put('/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({
    summary: 'Update device',
    description: 'Update an existing device',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Device Name' },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async updateDevice(@Param('id') id: string, @Body() body: any) {
    if (!id) {
      throw new HttpException('param id is required', 400);
    }
    const numericId = parseInt(id, 10);
    const result = await this.cmsDeviceService.updateDevice(numericId, body);
    return {
      status_code: 200,
      message: 'Module updated successfully',
      data: result,
    };
  }

  @Delete('/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete Device',
    description: 'Delete an existing Device',
  })
  @HttpCode(HttpStatus.OK)
  async deleteDevice(@Param('id') id: string) {
    if (!id) {
      throw new HttpException('param id is required', 400);
    }
    const numericId = parseInt(id, 10);
    const result = await this.cmsDeviceService.deleteModule(numericId);
    return {
      status_code: 200,
      message: 'Module deleted successfully',
      data: result,
    };
  }
}
