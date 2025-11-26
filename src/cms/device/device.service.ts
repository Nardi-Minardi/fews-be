import { Injectable, HttpException, Inject } from '@nestjs/common';
import { ValidationService } from 'src/common/validation.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { CmsDeviceValidation } from './device.validation';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
import { Logger } from 'winston';
import { CmsDeviceRepository } from './device.repository';

@Injectable()
export class CmsDeviceService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly validationService: ValidationService,
    private readonly cmsDeviceRepository: CmsDeviceRepository,
    private readonly dataMasterRepository: DataMasterRepository,
  ) {}

  async getDevice(request: {
    instansi_id?: number;
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    das_ids?: number[];
  }): Promise<{ data: any[]; total: number }> {

    this.logger.info('Request get devices with params', { request });

    // Ambil data user
    const devices = await this.cmsDeviceRepository.findAllDevice({
      instansi_id: request.instansi_id,
      search: request.search,
      limit: request.limit,
      offset: request.offset,
      orderBy: request.orderBy,
      orderDirection: request.orderDirection,
      das_ids: request.das_ids,
    });

    // Hitung total user
    const total = await this.cmsDeviceRepository.countAllDevice({
      instansi_id: request.instansi_id,
      search: request.search,
      das_ids: request.das_ids,
    });

    return { data: devices, total };
  }

  //create modules
  async createModule(request: any & {}): Promise<any> {
     this.logger.info('Request create module', {
      request
    });
    const createRequest = this.validationService.validate(
      CmsDeviceValidation.createSchema,
      request,
    );

    //find instansi by id
    const instansi = await this.dataMasterRepository.findInstansiById(createRequest.instansi_id);
    if (!instansi) {
      throw new HttpException(`Instansi dengan id ${createRequest.instansi_id} tidak ditemukan`, 404);
    }
    
    //find module with name and instansi_id yang sama
    const existingDevice = await this.cmsDeviceRepository.findDeviceByNameAndInstansiId(createRequest.name, createRequest.instansi_id);
    if (existingDevice) {
      throw new HttpException(`Module dengan nama ${createRequest.name} sudah ada di instansi ${createRequest.instansi_id}`, 400);
    }

    const createdData =  {
      name: createRequest.name,
      instansi_id: createRequest.instansi_id,
      is_active: createRequest.is_active,
      description: createRequest.description,
    }

    const result = await this.cmsDeviceRepository.saveModule(createdData);
    return result;
  }

  async updateDevice(id: number, request: any & {}): Promise<any> {
     this.logger.info('Request update device', {
      id,
      request
    });
    const updateRequest = this.validationService.validate(
      CmsDeviceValidation.updateSchema,
      request,
    );

    const existingDevice = await this.cmsDeviceRepository.findDeviceById(id);
    if (!existingDevice) {
      throw new HttpException(`Device dengan id ${id} tidak ditemukan`, 404);
    }

    //cek jika nama diupdate, pastikan tidak ada device lain dengan nama yang sama di instansi yang sama
    if (updateRequest.name && updateRequest.name !== existingDevice.name) {
      const deviceWithSameName = await this.cmsDeviceRepository.findDeviceByNameAndInstansiId(updateRequest.name, existingDevice.instansi_id);
      if (deviceWithSameName) {
        throw new HttpException(`device dengan nama ${updateRequest.name} sudah ada di instansi ${existingDevice.instansi_id}`, 400);
      }
    }

    const updatedData =  {
      name: updateRequest.name ?? existingDevice.name,
    }

    const result = await this.cmsDeviceRepository.updateDevice(id, updatedData);
    return result;
  }

  //delete module
  async deleteModule(id: number): Promise<any> {
     this.logger.info('Request delete module', {
      id,
    });
    const existingModule = await this.cmsDeviceRepository.findDeviceById(id);
    if (!existingModule) {
      throw new HttpException(`Module dengan id ${id} tidak ditemukan`, 404);
    }
    const result = await this.cmsDeviceRepository.deleteModule(id);
    return result;
  }
}
