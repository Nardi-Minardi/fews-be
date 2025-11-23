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
import { CmsMenuService } from './menu.service';
import { getUserFromToken } from 'src/common/utils/helper.util';
import { CmsModuleRepository } from '../module/module.repository';
import { UserRole } from 'src/common/constants/role.enum';
import { Request as ExpressRequest } from 'express';

@ApiTags('CMS/Menu Management')
@Controller('cms/menus')
export class CmsMenuController {
  constructor(
    private readonly cmsMenuService: CmsMenuService,
    private readonly cmsModuleRepository: CmsModuleRepository,
  ) {}

  @Get('/')
  @ApiOperation({
    summary: 'Get All Menus',
    description: 'Mendapatkan daftar Menu',
  })
  async getAllMenus(
    @Query('search') search?: string,
    @Query('offset') offset = '0',
    @Query('limit') limit = '50',
    @Query('module_ids') moduleIdsQuery?: string,
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

    // Default moduleIds dari userLogin
    const modules = await this.cmsModuleRepository.findModulesByInstansiIds(
      (userLogin as any)?.instansi_id ? [(userLogin as any)?.instansi_id] : [],
    );
    let moduleIds = modules.map((mod) => mod.id);

    // Jika module_ids dikirim, parsing CSV
    if (moduleIdsQuery) {
      moduleIds = moduleIdsQuery
        .split(',')
        .map((id) => parseInt(id, 10))
        .filter((id) => !isNaN(id));
    }

    const pageNum = Math.max(parseInt(offset || '0', 10) || 0, 0) + 1;
    const limitNum = Math.min(
      Math.max(parseInt(limit || '50', 10) || 50, 1),
      200,
    );

    const { data: result, total } = await this.cmsMenuService.getMenus({
      module_ids: moduleIds,
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

  //create Menu endpoint can be added here
  @Post('/')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Create Menu',
    description: 'Create a new Menu',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Menu title' },
        module_id: { type: 'number', example: 1 },
      },
      required: ['title'],
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async createMenu(@Body() body: any) {
    const request = {
      ...body,
    };
    const result = await this.cmsMenuService.createMenu(request);

    return {
      status_code: 201,
      message: 'Menu created successfully',
      data: result,
    };
  }

  //edit Menu endpoint can be added here
  @Put('/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Update Menu',
    description: 'Update an existing Menu',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Updated Menu title' },
        module_id: { type: 'number', example: 1 },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async updateMenu(@Param('id') id: string, @Body() body: any) {
    if (!id) {
      throw new HttpException('param id is required', 400);
    }
    const numericId = parseInt(id, 10);
    const result = await this.cmsMenuService.updateMenu(numericId, body);
    return {
      status_code: 200,
      message: 'Menu updated successfully',
      data: result,
    };
  }

  //delete Menu endpoint can be added here
  @Delete('/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Delete Menu',
    description: 'Delete an existing Menu',
  })
  @HttpCode(HttpStatus.OK)
  async deleteMenu(@Param('id') id: string) {
    if (!id) {
      throw new HttpException('param id is required', 400);
    }
    const numericId = parseInt(id, 10);
    const result = await this.cmsMenuService.deleteMenu(numericId);
    return {
      status_code: 200,
      message: 'Menu deleted successfully',
      data: result,
    };
  }

  //asssing user to Menu endpoint can be added here
  @Post('/:id/assign-user')
  @ApiOperation({
    summary: 'Assign User to Menu',
    description: 'Assign a user to a Menu',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        user_id: { type: 'number', example: 1 },
        permissions: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['view', 'create', 'edit', 'delete'],
          },
          example: ['view', 'edit'],
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async assignUserToMenu(@Param('id') id: string, @Body() body: any) {
    const result = await this.cmsMenuService.assignUserToMenu(
      parseInt(id, 10),
      body,
    );
    return {
      status_code: 200,
      message: 'Assign User to Menu - to be implemented',
      data: result,
    };
  }
}
