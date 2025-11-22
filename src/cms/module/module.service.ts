import { Injectable, HttpException, Inject } from '@nestjs/common';
import { ValidationService } from 'src/common/validation.service';
import { CmsModuleRepository } from './module.repository';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { CmsModuleValidation } from './module.validation';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
import { Logger } from 'winston';

@Injectable()
export class CmsModuleService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly validationService: ValidationService,
    private readonly cmsModuleRepository: CmsModuleRepository,
    private readonly dataMasterRepository: DataMasterRepository,
  ) {}

  async getModules(request: {
    instansi_id?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number }> {

    this.logger.info('Request get modules with params', { request });

    // Ambil data user
    const modules = await this.cmsModuleRepository.findAllModule({
      instansi_id: request.instansi_id,
      search: request.search,
      limit: request.limit,
      offset: request.offset,
    });

    // Hitung total user
    const total = await this.cmsModuleRepository.countAllModule({
      instansi_id: request.instansi_id,
      search: request.search,
    });

    // Mapping user supaya password tidak ikut
    const mappedModules = modules.map((module) => ({
      id: module.id,
      name: module.name,
      instansi_id: module.instansi_id,
      instansi_name: module.m_instansi.name,
      is_active: module.is_active,
      created_at: module.created_at,
      updated_at: module.updated_at,
    }));

    return { data: mappedModules, total };
  }

  //create modules
  async createModule(request: any & {}): Promise<any> {
     this.logger.info('Request create module', {
      request
    });
    const createRequest = this.validationService.validate(
      CmsModuleValidation.createSchema,
      request,
    );

    //find instansi by id
    const instansi = await this.dataMasterRepository.findInstansiById(createRequest.instansi_id);
    if (!instansi) {
      throw new HttpException(`Instansi dengan id ${createRequest.instansi_id} tidak ditemukan`, 404);
    }
    
    //find module with name and instansi_id yang sama
    const existingModule = await this.cmsModuleRepository.findModuleByNameAndInstansiId(createRequest.name, createRequest.instansi_id);
    if (existingModule) {
      throw new HttpException(`Module dengan nama ${createRequest.name} sudah ada di instansi ${createRequest.instansi_id}`, 400);
    }

    const createdData =  {
      name: createRequest.name,
      instansi_id: createRequest.instansi_id,
      is_active: createRequest.is_active,
      description: createRequest.description,
    }

    const result = await this.cmsModuleRepository.saveModule(createdData);
    return result;
  }

  //update module
  async updateModule(id: number, request: any & {}): Promise<any> {
     this.logger.info('Request update module', {
      id,
      request
    });
    const updateRequest = this.validationService.validate(
      CmsModuleValidation.updateSchema,
      request,
    );

    const existingModule = await this.cmsModuleRepository.findModuleById(id);
    if (!existingModule) {
      throw new HttpException(`Module dengan id ${id} tidak ditemukan`, 404);
    }

    //cek jika nama diupdate, pastikan tidak ada module lain dengan nama yang sama di instansi yang sama
    if (updateRequest.name && updateRequest.name !== existingModule.name) {
      const moduleWithSameName = await this.cmsModuleRepository.findModuleByNameAndInstansiId(updateRequest.name, existingModule.instansi_id);
      if (moduleWithSameName) {
        throw new HttpException(`Module dengan nama ${updateRequest.name} sudah ada di instansi ${existingModule.instansi_id}`, 400);
      }
    }

    const updatedData =  {
      name: updateRequest.name ?? existingModule.name,
      is_active: updateRequest.is_active ?? existingModule.is_active,
      description: updateRequest.description ?? existingModule.description,
    }

    const result = await this.cmsModuleRepository.updateModule(id, updatedData);
    return result;
  }

  //delete module
  async deleteModule(id: number): Promise<any> {
     this.logger.info('Request delete module', {
      id,
    });
    const existingModule = await this.cmsModuleRepository.findModuleById(id);
    if (!existingModule) {
      throw new HttpException(`Module dengan id ${id} tidak ditemukan`, 404);
    }
    const result = await this.cmsModuleRepository.deleteModule(id);
    return result;
  }
}
