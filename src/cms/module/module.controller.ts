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
import { CmsModuleService } from './module.service';
import { getUserFromToken } from 'src/common/utils/helper.util';
import { UserRole } from 'src/common/constants/role.enum';
import { Request as ExpressRequest } from 'express';

@ApiTags('CMS/Module Management')
@Controller('cms/modules')
export class CmsModuleController {
  constructor(private readonly cmsModuleService: CmsModuleService) {}

  @Get('/')
  @ApiOperation({
    summary: 'Get All Modules',
    description: 'Mendapatkan daftar semua user (hanya admin dan operator)',
  })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @HttpCode(HttpStatus.OK)
  async getAllModules(
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
    console.log('userLogin', userLogin);

    const pageNum = Math.max(parseInt(offset || '0', 10) || 0, 0) + 1;
    const limitNum = Math.min(
      Math.max(parseInt(limit || '50', 10) || 50, 1),
      200,
    );

    const { data: result, total } = await this.cmsModuleService.getModules({
      instansi_id: instansi_id
        ? parseInt(instansi_id, 10)
        : (userLogin as any)?.instansi_id || undefined,
      search,
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      orderBy,
      orderDirection,
    });

    return {
      status_code: 200,
      message: 'success',
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
      total_data: total,
      data: result,
    };
  }

  //create module endpoint can be added here
  @Post('/')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Create Module',
    description: 'Create a new module',
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
  async createModule(@Body() body: any) {
    const request = {
      ...body,
    };
    const result = await this.cmsModuleService.createModule(request);

    return {
      status_code: 201,
      message: 'Module created successfully',
      data: result,
    };
  }

  //edit module endpoint can be added here
  @Put('/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Update Module',
    description: 'Update an existing module',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        instansi_id: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Updated Module Name' },
        is_active: { type: 'boolean', example: true },
        description: { type: 'string', example: 'Updated Module Description' },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async updateModule(@Param('id') id: string, @Body() body: any) {
    if (!id) {
      throw new HttpException('param id is required', 400);
    }
    const numericId = parseInt(id, 10);
    const result = await this.cmsModuleService.updateModule(numericId, body);
    return {
      status_code: 200,
      message: 'Module updated successfully',
      data: result,
    };
  }

  //delete module endpoint can be added here
  @Delete('/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Delete Module',
    description: 'Delete an existing module',
  })
  @HttpCode(HttpStatus.OK)
  async deleteModule(@Param('id') id: string) {
    if (!id) {
      throw new HttpException('param id is required', 400);
    }
    const numericId = parseInt(id, 10);
    const result = await this.cmsModuleService.deleteModule(numericId);
    return {
      status_code: 200,
      message: 'Module deleted successfully',
      data: result,
    };
  }
}
