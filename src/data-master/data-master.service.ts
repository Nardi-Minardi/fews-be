import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ValidationService } from 'src/common/validation.service';
import { Logger } from 'winston';
import { DataMasterValidation } from './data-master.validation';
import { DataMasterRepository } from './data-master.repository';
import { ResponseNotarisPenggantiDto } from './dto/notaris-pengganti.dto';

@Injectable()
export class DataMasterService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private validationService: ValidationService,
    private dataMasterRepository: DataMasterRepository,
  ) {}

  private readonly jangkaWaktuMapper = {
    terbatas: 'Terbatas',
    tidakTerbatas: 'Tidak Terbatas',
  };

  private readonly statusPengajuanMapper = {
    belumTerkonfirmasi: 'Belum Terkonfirmasi',
    sudahTerkonfirmasi: 'Sudah Terkonfirmasi',
  };

  private readonly jabatanMapper = {
    sekutuPasif: 'Sekutu Pasif',
    sekutuAktif: 'Sekutu Aktif',
  };

  private readonly kontribusiMapper = {
    uang: 'Uang',
    barang: 'Barang',
  };

  async searchNotarisPengganti(request: {
    nama: string;
  }): Promise<ResponseNotarisPenggantiDto> {
    this.logger.debug('Searching for Notaris Pengganti with request:', request);

    const getRequest: { nama: string } = this.validationService.validate(
      DataMasterValidation.SEARCH_NOTARIS_PENGGANTI,
      request,
    );
    // console.log('Validated request:', getRequest);

    // Kalau search kosong/null → return kosong
    if (!getRequest.nama || getRequest.nama.trim() === '') {
      return {
        list: [],
        countData: 0,
      };
    }

    // Get notaris
    const notaris = await this.dataMasterRepository.findNotarisPenggantiByNama(
      getRequest.nama,
    );

    if (!notaris || notaris.length === 0) {
      this.logger.error(`Notaris with nama "${getRequest.nama}" not found`);
      return {
        list: [],
        countData: 0,
      };
    }

    const countData =
      await this.dataMasterRepository.countSearchNotarisPengganti(
        getRequest.nama,
      );

    return {
      list: notaris.map((item) => ({
        id: item.id,
        nama: item.nama,
        provinsi: item.provinsi,
        id_provinsi: item.id_provinsi,
      })),
      countData,
    };
  }

  /**
   * Validasi semua KBLI berdasarkan daftar id_kbli
   * Akan throw NotFoundException kalau ada ID yang tidak ditemukan
   */
  async validateKblis(ids: number[]): Promise<void> {
    if (!ids || ids.length === 0) {
      return; // tidak ada KBLI untuk dicek
    }

    this.logger.debug(`Validating KBLI IDs: [${ids.join(', ')}]`);

    const kbliResults = await Promise.all(
      ids.map((id) => this.dataMasterRepository.findKbliById(id)),
    );

    const notFoundKbliIds = ids.filter((_, index) => !kbliResults[index]);

    if (notFoundKbliIds.length > 0) {
      throw new NotFoundException(
        `KBLI dengan ID [${notFoundKbliIds.join(', ')}] tidak ditemukan di database`,
      );
    }
  }

}
