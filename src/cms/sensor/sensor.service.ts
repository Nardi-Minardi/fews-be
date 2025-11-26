import { Injectable, HttpException, Inject } from '@nestjs/common';
import { ValidationService } from 'src/common/validation.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
import { Logger } from 'winston';
import { CmsSensorRepository } from './sensor.repository';

@Injectable()
export class CmsSensorService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly validationService: ValidationService,
    private readonly cmsSensorRepository: CmsSensorRepository,
    private readonly dataMasterRepository: DataMasterRepository,
  ) {}

  async getSensorLog(request: {
    instansi_id?: number;
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  }): Promise<{ data: any[]; total: number }> {

    this.logger.info('Request get sensor log with params', { request });

    // Ambil data user
    const devices = await this.cmsSensorRepository.findAllSensorLog({
      instansi_id: request.instansi_id,
      search: request.search,
      limit: request.limit,
      offset: request.offset,
      orderBy: request.orderBy,
      orderDirection: request.orderDirection,
    });

    // Hitung total user
    const total = await this.cmsSensorRepository.countAllSensorLog({
      instansi_id: request.instansi_id,
      search: request.search,
    });

    return { data: devices, total };
  }
}
