import { Injectable, HttpException, Inject } from '@nestjs/common';
import { ValidationService } from 'src/common/validation.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
import { Logger } from 'winston';
import { CmsDasRepository } from './das.repository';

@Injectable()
export class CmsDasService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly validationService: ValidationService,
    private readonly cmsDasRepository: CmsDasRepository,
    private readonly dataMasterRepository: DataMasterRepository,
  ) {}

  async getDas(request: {
    search?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
    instansi_id?: number;
  }): Promise<{ data: any[]; total: number }> {

    this.logger.info('Request get DAS with params', { request });

    // Ambil data user
    const devices = await this.cmsDasRepository.findAllDas({
      search: request.search,
      limit: request.limit,
      offset: request.offset,
      orderBy: request.orderBy,
      orderDirection: request.orderDirection,
      instansi_id: request.instansi_id,
    });

    // Hitung total user
    const total = await this.cmsDasRepository.countAllDas({
      search: request.search,
      instansi_id: request.instansi_id,
    });

    return { data: devices, total };
  }
}
