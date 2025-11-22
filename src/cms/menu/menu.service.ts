import { Injectable, HttpException, Inject } from '@nestjs/common';
import { ValidationService } from 'src/common/validation.service';
import { CmsMenuRepository } from './menu.repository';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { CmsMenuValidation } from './menu.validation';
import { CmsModuleRepository } from '../module/module.repository';
import { AuthRepository } from 'src/auth/auth.repository';
import { Logger } from 'winston';

@Injectable()
export class CmsMenuService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly validationService: ValidationService,
    private readonly cmsMenuRepository: CmsMenuRepository,
    private readonly cmsModuleRepository: CmsModuleRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  async getMenus(request: {
    module_ids?: number[];
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number }> {
    this.logger.info('Request get menus with params', { request });

    // Ambil data user
    const menus = await this.cmsMenuRepository.findAllMenu({
      module_ids: request.module_ids,
      search: request.search,
      limit: request.limit,
      offset: request.offset,
    });

    // Hitung total user
    const total = await this.cmsMenuRepository.countAllMenu({
      module_ids: request.module_ids,
      search: request.search,
    });

    // Mapping user supaya password tidak ikut
    const mappedMenus = menus.map((menu) => ({
      id: menu.id,
      title: menu.title,
      value: menu.value,
      path: menu.path,
      module_id: menu.module_id,
      module_name: menu.m_modules.name,
      is_active: menu.is_active,
      created_at: menu.created_at,
      updated_at: menu.updated_at,
    }));

    return { data: mappedMenus, total };
  }

  //create menus
  async createMenu(request: any & {}): Promise<any> {
    this.logger.info('Request create menu', {
      request,
    });

    const createRequest = this.validationService.validate(
      CmsMenuValidation.createSchema,
      request,
    );

    //check module exists
    const existingModule = await this.cmsModuleRepository.findModuleById(
      createRequest.module_id,
    );
    if (!existingModule) {
      throw new HttpException(
        `Module dengan id ${createRequest.module_id} tidak ditemukan`,
        404,
      );
    }

    //cek nama menu sudah ada di module yang sama
    const existingMenu =
      await this.cmsMenuRepository.findMenuByTitleAndModuleId(
        createRequest.title,
        createRequest.module_id,
      );
    if (existingMenu) {
      throw new HttpException(
        `Menu dengan title ${createRequest.title} sudah ada di module id ${createRequest.module_id}`,
        400,
      );
    }

    const createdData = {
      title: createRequest.title,
      module_id: createRequest.module_id,
      value: createRequest.title.toUpperCase().replace(/\s+/g, '_'),
      path: createRequest.title.toLowerCase().replace(/\s+/g, '-'),
    };

    const result = await this.cmsMenuRepository.saveMenu(createdData);
    return result;
  }

  //update menu
  async updateMenu(id: number, request: any & {}): Promise<any> {
    this.logger.info('Request update menu', {
      id,
      request,
    });
    const updateRequest = this.validationService.validate(
      CmsMenuValidation.updateSchema,
      request,
    );

    //check module exists
    const existingModule = await this.cmsModuleRepository.findModuleById(
      updateRequest.module_id,
    );
    if (!existingModule) {
      throw new HttpException(
        `Module dengan id ${updateRequest.module_id} tidak ditemukan`,
        404,
      );
    }

    const existingMenu = await this.cmsMenuRepository.findMenuById(id);
    if (!existingMenu) {
      throw new HttpException(`Menu dengan id ${id} tidak ditemukan`, 404);
    }

    //cek jika nama diupdate, pastikan tidak ada menu lain dengan nama yang sama di module yang sama
    if (updateRequest.title && updateRequest.title !== existingMenu.title) {
      const menuWithSameTitle =
        await this.cmsMenuRepository.findMenuByTitleAndModuleId(
          updateRequest.title,
          existingMenu.module_id,
        );
      console.log(menuWithSameTitle);
      if (menuWithSameTitle) {
        throw new HttpException(
          `Menu dengan title ${updateRequest.title} sudah ada di module id ${existingMenu.module_id}`,
          400,
        );
      }
    }

    const updatedData = {
      title: updateRequest.title ?? existingMenu.title,
      module_id: updateRequest.module_id ?? existingMenu.module_id,
      value: updateRequest.title
        ? updateRequest.title.toUpperCase().replace(/\s+/g, '_')
        : existingMenu.value,
      path: updateRequest.title
        ? updateRequest.title.toLowerCase().replace(/\s+/g, '-')
        : existingMenu.path,
    };

    const result = await this.cmsMenuRepository.updateMenu(id, updatedData);
    return result;
  }

  //delete menu
  async deleteMenu(id: number): Promise<any> {
    this.logger.info('Request delete menu', {
      id,
    });
    const existingMenu = await this.cmsMenuRepository.findMenuById(id);
    if (!existingMenu) {
      throw new HttpException(`Menu dengan id ${id} tidak ditemukan`, 404);
    }
    const result = await this.cmsMenuRepository.deleteMenu(id);
    return result;
  }

  //assign permission to menu can be added here
  async assignUserToMenu(id: number, request: any & {}): Promise<any> {
    this.logger.info('Request assign user to menu', {
      id,
      request,
    });
    const createRequest = this.validationService.validate(
      CmsMenuValidation.assingMenuSchema,
      request,
    );

    const existingMenu = await this.cmsMenuRepository.findMenuById(id);
    if (!existingMenu) {
      throw new HttpException(`Menu dengan id ${id} tidak ditemukan`, 404);
    }

    //cek user
    const existingUser = await this.authRepository.findById(
      createRequest.user_id,
    );

    if (!existingUser) {
      throw new HttpException(
        `User dengan id ${createRequest.user_id} tidak ditemukan`,
        404,
      );
    }

    //cek menu tersebut punya module yang sama dengan user dengan instansi yang sama
    const checkMenu = await this.cmsMenuRepository.checkMenuModule(
      id,
      createRequest.user_id,
    );
    if (!checkMenu) {
      throw new HttpException(
        `Menu dengan id ${id} bukan bagian dari module di instansi yang sama dengan user id ${createRequest.user_id}`,
        400,
      );
    }

    const createdData = {
      menu_id: id,
      user_id: Number(createRequest.user_id),
      permissions: createRequest.permissions,
      menu_name: existingMenu.title,
    };

    //create or update logic can be added here
    const result = await this.cmsMenuRepository.doAssignMenuToUser(createdData);
    return result;
  }
}
