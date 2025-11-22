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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CmsUserService } from './user.service';
import { CmsUserValidation } from './user.validation';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/common/constants/role.enum';

@ApiTags('CMS/User Management')
@Controller('cms/users')
export class CmsUserController {
  constructor(private readonly cmsUserService: CmsUserService) {}

  @Get('/')
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  // @RequirePermission('users', 'read')
  @ApiOperation({
    summary: 'Get All Users',
    description: 'Mendapatkan daftar semua user (hanya admin dan operator)',
  })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @HttpCode(HttpStatus.OK)
  async getAllUsers(
    @Query('role_id') role_id: string,
    @Query('search') search?: string,
    @Query('offset') offset = '0',
    @Query('limit') limit = '50',
    @Query('order_by') orderBy?: string,
    @Query('order_direction') orderDirection?: 'asc' | 'desc',
  ) {
    console.log('orderBy', orderBy);
    console.log('orderDirection', orderDirection);
    const pageNum = Math.max(parseInt(offset || '0', 10) || 0, 0) + 1;
    const limitNum = Math.min(
      Math.max(parseInt(limit || '50', 10) || 50, 1),
      200,
    );

    const { data: result, total } = await this.cmsUserService.getUsers({
      role_id: role_id ? parseInt(role_id, 10) : undefined,
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

  @Post('/')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Create User',
    description: 'Membuat user baru',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'johndoe' },
        password: { type: 'string', example: 'securepassword' },
        full_name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'jhon@gmail.com' },
        role_id: { type: 'number', example: 2 },
        instansi_id: { type: 'number', example: 1 },
        is_active: { type: 'boolean', example: true },
        jabatan_id: { type: 'number', example: 1 },
        wilayah_kerja: {
          type: 'string[]',
          example: ['Jawa Barat', 'DKI Jakarta'],
        },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() body: any) {
    const request = {
      ...body,
    };

    const result = await this.cmsUserService.createUser(request);

    return {
      status_code: 201,
      message: 'User created successfully',
      data: result,
    };
  }

  @Put('/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Update User',
    description: 'Update an existing user',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'johndoe' },
        password: { type: 'string', example: 'securepassword' },
        full_name: { type: 'string', example: 'John Doe' },
        email: { type: 'string', example: 'jhon@gmail.com' },
        role_id: { type: 'number', example: 2 },
        instansi_id: { type: 'number', example: 1 },
        is_active: { type: 'boolean', example: true },
        jabatan_id: { type: 'number', example: 1 },
        wilayah_kerja: {
          type: 'string[]',
          example: ['Jawa Barat', 'DKI Jakarta'],
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async updateUser(@Param('id') id: string, @Body() body: any) {
    if (!id) {
      throw new HttpException('param id is required', 400);
    }
    const numericId = parseInt(id, 10);
    const result = await this.cmsUserService.updateUser(numericId, body);
    return {
      status_code: 200,
      message: 'User updated successfully',
      data: result,
    };
  }

  //delete
  @Delete('/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({
    summary: 'Delete User',
    description: 'Delete an existing user',
  })
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    if (!id) {
      throw new HttpException('param id is required', 400);
    }
    const numericId = parseInt(id, 10);
    await this.cmsUserService.deleteUser(numericId);
    return {
      status_code: 200,
      message: 'User deleted successfully',
    };
  }
}
