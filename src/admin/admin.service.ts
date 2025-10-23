import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ValidationService } from 'src/common/validation.service';
import { Logger } from 'winston';
import {
  dateOnlyToLocal,
  getUserFromToken,
} from 'src/common/utils/helper.util';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { FileUploadRepository } from 'src/file-upload/file-upload.repository';
import { S3Service } from 'src/common/s3.service';
import { status_upload_ii, Prisma } from '.prisma/main-client';
import { PpnsUploadDto } from 'src/file-upload/dto/upload.dto';
import { SuratRepository } from 'src/surat/surat.repository';
import {
  AdminRepository,
} from './admin.repository';
import { AdminValidation } from './admin.validation';
import { LayananRepository } from 'src/layanan/layanan.repository';
import {
  DaftarVerifikasiPaginationDto,
  DaftarVerifikasiRequestPaginationDto,
} from './dto/get.admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private validationService: ValidationService,
    private fileUploadService: FileUploadService,
    private fileUploadRepository: FileUploadRepository,
    private adminRepository: AdminRepository,
    private layananRepository: LayananRepository,
    private s3Service: S3Service,
  ) {}

  async getListDaftarVerifikasi(
    request: DaftarVerifikasiRequestPaginationDto,
    authorization: string,
  ): Promise<DaftarVerifikasiPaginationDto> {
    this.logger.debug('Fetching list Daftar Verifikasi', { request });

    // 1️⃣ Validasi input
    const getRequest = this.validationService.validate(
      AdminValidation.GET_SURAT_PAGINATION,
      request,
    );

    // 2️⃣ Ambil user login
    const userLogin = await getUserFromToken(authorization);
    if (!userLogin) {
      this.logger.error('Authorization token is missing');
      throw new BadRequestException('Authorization is missing');
    }

    // 3️⃣ Ambil data + count secara paralel
    const [data, total] = await Promise.all([
      this.adminRepository.findAllWithDaftarVerifikasi(
        getRequest.search,
        getRequest.page,
        getRequest.limit,
        getRequest.orderBy,
        getRequest.orderDirection,
        getRequest.filters,
        null,
      ),
      this.adminRepository.countDaftarVerifikasi(
        getRequest.layanan,
        getRequest.search,
      ),
    ]);

    // 4️⃣ Buat pagination
    const pagination = {
      currentPage: getRequest.page,
      totalPage: Math.ceil(total / getRequest.limit),
      totalData: total,
    };

    // 5️⃣ Return data dengan mapping field tanggal dan null safety
    return {
      data: data.map((item: any) => ({
        id: item.id,
        id_user: item.id_user,
        lembaga_kementerian: item.lembaga_kementerian,
        instansi: item.instansi,
        no_surat: item.no_surat ?? '',
        tgl_surat: item.tgl_surat ? item.tgl_surat.toISOString() : '',
        perihal: item.perihal ?? '',
        nama_pengusul: item.nama_pengusul ?? '',
        jabatan_pengusul: item.jabatan_pengusul ?? '',
        status: item.status ?? null,
        created_at: item.created_at ? item.created_at.toISOString() : '',
        created_by: item.created_by ?? null,
        verifikator_by: item.verifikator_by ?? null,
        verifikator_at: item.verifikator_at
          ? item.verifikator_at.toISOString()
          : null,
        id_layanan: item.id_layanan ?? null,
        nama_kementerian: item.ppns_kementerian
          ? item.ppns_kementerian.nama
          : null,
        nama_instansi: item.ppns_instansi ? item.ppns_instansi.nama : null,
        ppns_instansi: item.ppns_instansi ? item.ppns_instansi : null,
        ppns_kementerian: item.ppns_kementerian ? item.ppns_kementerian : null,
        ppns_layanan: item.ppns_layanan ? item.ppns_layanan : null,
        count_calon_ppns: item.count_calon_ppns ?? 0,
      })),
      pagination,
    };
  }
}
