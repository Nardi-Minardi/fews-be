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
  CreateRequestSendVerifikatorDto,
  CreateResponsePpnsDataPnsDto,
  CreateResponseSendVerifikatorDto,
  CreateResponseSuratDto,
} from './dto/create.surat.dto';
import { SuratValidation } from './surat.validation';
import {
  dateOnlyToLocal,
  generateUniqueString,
  getUserFromToken,
} from 'src/common/utils/helper.util';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { FileUploadRepository } from 'src/file-upload/file-upload.repository';
import { SuratRepository } from './surat.repository';
import { S3Service } from 'src/common/s3.service';
import {
  upload_status_enum,
  Prisma,
  jenis_kelamin_enum,
} from '.prisma/main-client';
import { PpnsUploadDto } from 'src/file-upload/dto/upload.dto';
import { validateWilayah } from 'src/common/utils/validateWilayah';
import { DataMasterRepository } from 'src/data-master/data-master.repository';
import { LayananRepository } from 'src/layanan/layanan.repository';
import { GetSuratPaginationDto, SuratPaginationDto } from './dto/get.surat.dto';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class SuratService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
    private validationService: ValidationService,
    private fileUploadService: FileUploadService,
    private fileUploadRepository: FileUploadRepository,
    private suratRepository: SuratRepository,
    private dataMasterRepository: DataMasterRepository,
    private layananRepository: LayananRepository,
    private s3Service: S3Service,
    private prismaService: PrismaService,
  ) {}

  async storeSurat(
    request: any & {
      dok_surat_pernyataan: Express.Multer.File;
    },
    authorization?: string,
  ): Promise<CreateResponseSuratDto> {
    // clone request tanpa field dok_surat_pernyataan
    const safeRequest = { ...request };
    delete safeRequest.dok_surat_pernyataan;

    // log hanya safeRequest (tanpa file)
    this.logger.debug('Request Creating permohonan verifikasi create surat', {
      request: safeRequest,
    });

    const createRequest = this.validationService.validate(
      SuratValidation.CREATE_SURAT,
      request,
    );

    //get user login
    const userLogin = await getUserFromToken(authorization);
    if (!userLogin) {
      this.logger.error('Authorization token is missing');
      throw new BadRequestException('Authorization is missing');
    }

    let dataLayanan: any;
    let namePrefixUpload: string;

    switch (createRequest.layanan) {
      case 'verifikasi':
        dataLayanan =
          await this.layananRepository.findLayananByNama('verifikasi');

        namePrefixUpload = 'verifikasi';
        break;

      case 'pengangkatan':
        dataLayanan =
          await this.layananRepository.findLayananByNama('pengangkatan');
        namePrefixUpload = 'pengangkatan';
        break;

      case 'pelantikan':
        dataLayanan =
          await this.layananRepository.findLayananByNama('pelantikan');
        namePrefixUpload = 'pelantikan';
        break;

      case 'mutasi':
        dataLayanan = await this.layananRepository.findLayananByNama('mutasi');
        namePrefixUpload = 'mutasi';
        break;

      case 'pengangkatan kembali':
        dataLayanan = await this.layananRepository.findLayananByNama(
          'pengangkatan kembali',
        );
        namePrefixUpload = 'pengangkatan-kembali';
        break;

      case 'perpanjang ktp':
        dataLayanan =
          await this.layananRepository.findLayananByNama('perpanjang ktp');
        namePrefixUpload = 'perpanjang-ktp';
        break;

      case 'penerbitan kembali ktp':
        dataLayanan = await this.layananRepository.findLayananByNama(
          'penerbitan kembali ktp',
        );
        namePrefixUpload = 'penerbitan-kembali-ktp';
        break;

      case 'undur diri':
        dataLayanan =
          await this.layananRepository.findLayananByNama('undur diri');
        namePrefixUpload = 'undur-diri';
        break;

      case 'pensiun':
        dataLayanan = await this.layananRepository.findLayananByNama('pensiun');
        namePrefixUpload = 'pensiun';
        break;

      case 'pemberhentian NTO':
        dataLayanan =
          await this.layananRepository.findLayananByNama('pemberhentian NTO');
        namePrefixUpload = 'pemberhentian-nto';
        break;

      default:
        throw new BadRequestException(
          `Layanan '${createRequest.layanan}' tidak dikenali`,
        );
    }

    // cek lembaga kementerian
    const kementerian = await this.dataMasterRepository.findKementerianById(
      Number(createRequest.lembaga_kementerian),
    );

    if (!kementerian) {
      throw new NotFoundException(
        `Lembaga Kementerian with ID ${createRequest.lembaga_kementerian} not found`,
      );
    }

    //cek instansi
    const instansi = await this.dataMasterRepository.findInstansiById(
      Number(createRequest.instansi),
    );
    if (!instansi) {
      throw new NotFoundException(
        `Instansi with ID ${createRequest.instansi} not found`,
      );
    }

    const createData = {
      id_user: userLogin.user_id,
      id_layanan: dataLayanan?.id,
      lembaga_kementerian: Number(createRequest.lembaga_kementerian),
      instansi: Number(createRequest.instansi),
      no_surat: createRequest.no_surat,
      tgl_surat: createRequest.tgl_surat
        ? dateOnlyToLocal(createRequest.tgl_surat)
        : null,
      perihal: createRequest.perihal,
      nama_pengusul: createRequest.nama_pengusul,
      jabatan_pengusul: createRequest.jabatan_pengusul,
      status: false,
      created_by: userLogin.user_id,
    };

    const result = await this.suratRepository.saveSurat(createData);

    const dataUploadDB: PpnsUploadDto[] = [];

    // jika ada dokumen surat pernyataan
    if (request.dok_surat_pernyataan) {
      if (result.id_user === null) {
        throw new BadRequestException('User ID is missing');
      }

      const masterFile =
        await this.fileUploadRepository.getMasterPpnsUploadByIdByName(
           'dok_surat_pernyataan',
        );

      const existing = await this.fileUploadRepository.findFilePpnsUpload(
        'dok_surat_pernyataan',
        Number(result.id),
        Number(result.id_user),
      );

      await Promise.all(
        existing.map(
          (file) => file.s3_key && this.s3Service.deleteFile(file.s3_key),
        ),
      );
      const upload = await this.fileUploadService.handleUpload(
        request.dok_surat_pernyataan,
        'dok_surat_pernyataan',
        result.id,
        null,
        namePrefixUpload,
        masterFile ? masterFile.id : null,
        'dok_surat_pernyataan',
        upload_status_enum.pending,
      );

      dataUploadDB.push(upload);
    }

    // simpan file upload ke DB
    if (dataUploadDB.length > 0) {
      await this.suratRepository.createOrUpdatePpnsUpload(
        result.id,
        dataUploadDB.map((d) => ({
          ...d,
          id_ppns: null,
          id_surat: Number(result.id),
          id_file_type: d.master_file_id ?? null,
        })),
      );
    }

    // ✅ ambil ulang file upload dari DB supaya data pasti sudah tersimpan
    const dok_pernyataan = await this.fileUploadRepository.findFilePpnsUpload(
      'dok_surat_pernyataan',
      Number(result.id),
      Number(result.id_user),
    );

    // mapping hasil ke DTO (pastikan tanggal diubah ke ISO string)
    const response: CreateResponseSuratDto = {
      id: result.id || null,
      id_user: result.id_user || null,
      id_layanan: result.id_layanan || null,
      nama_layanan: dataLayanan?.nama || null,
      lembaga_kementerian: result.lembaga_kementerian || null,
      instansi: result.instansi || null,
      no_surat: result.no_surat || null,
      tgl_surat: result.tgl_surat ? result.tgl_surat.toISOString() : null,
      perihal: result.perihal || null,
      nama_pengusul: result.nama_pengusul || null,
      jabatan_pengusul: result.jabatan_pengusul || null,
      status: result.status,
      created_at: result.created_at ? result.created_at.toISOString() : null,
      created_by: result.created_by || null,
      verifikator_by: result.verifikator_by || null,
      verifikator_at: result.verifikator_at
        ? result.verifikator_at.toISOString()
        : null,
      dok_surat_pernyataan: dok_pernyataan[0],
    };

    return response;
  }

  async doSendVerifikator(
    request: CreateRequestSendVerifikatorDto,
    authorization?: string,
  ): Promise<CreateResponseSendVerifikatorDto> {
    this.logger.debug(
      'Request send permohonan verifikator send verifikasi to verifikator',
      { request },
    );

    // Handle if body is empty
    if (!request || Object.keys(request).length === 0) {
      this.logger.error('Request body is empty');
      throw new BadRequestException('Request body cannot be empty');
    }

    const createRequest = this.validationService.validate(
      SuratValidation.CREATE_SEND_VERIFIKATOR,
      request,
    );

    //get user login
    const userLogin = await getUserFromToken(authorization);
    if (!userLogin) {
      this.logger.error('Authorization token is missing');
      throw new BadRequestException('Authorization is missing');
    }

    const existingSurat = await this.suratRepository.findPpnSuratById(
      createRequest.id_surat,
    );

    if (!existingSurat) {
      throw new HttpException(
        `Data Ppns surat dengan ID ${createRequest.id_surat} tidak ditemukan`,
        400,
      );
    }

    //cek jika statusnya true, berarti sudah dikirim ke verifikator
    if (existingSurat.status === true) {
      throw new HttpException(
        `Data Ppns surat dengan ID ${createRequest.id_surat} sudah dikirim ke verifikator`,
        400,
      );
    }

    //cek relasi ppns_data_pns harus ada, relasi berupa array
    if (
      !existingSurat.ppns_data_pns ||
      existingSurat.ppns_data_pns.length === 0
    ) {
      throw new HttpException(
        `Data Ppns surat dengan ID ${createRequest.id_surat} belum memiliki calon ppns, silakan tambahkan calon ppns terlebih dahulu`,
        400,
      );
    }

    //find layanan by id
    if (
      existingSurat.id_layanan === null ||
      existingSurat.id_layanan === undefined
    ) {
      throw new BadRequestException('ID Layanan is missing');
    }
    const layanan = await this.layananRepository.findLayananById(
      existingSurat.id_layanan,
    );
    if (!layanan) {
      throw new NotFoundException(
        `Layanan with ID ${existingSurat.id_layanan} not found`,
      );
    }

    // Buat mapping antara layanan dan nama relasi yang harus dicek
    const relasiMap = {
      verifikasi: {
        key: 'ppns_verifikasi_ppns',
        message: 'data verifikasi ppns',
      },
      pelantikan: {
        key: 'ppns_pelantikan',
        message: 'data pelantikan',
      },
      pengangkatan: {
        key: 'ppns_pengangkatan',
        message: 'data pengangkatan',
      },
    } as const;

    const relasi = relasiMap[layanan.nama as keyof typeof relasiMap];

    if (!relasi) {
      throw new BadRequestException(
        `Layanan '${createRequest.layanan}' tidak dikenali`,
      );
    }

    // Loop semua ppns_data_pns dan cek relasi sesuai layanan
    for (const ppnsDataPns of existingSurat.ppns_data_pns) {
      const dataRelasi = ppnsDataPns[relasi.key];

      if (!dataRelasi || dataRelasi.length === 0) {
        throw new HttpException(
          `Data calon ppns dengan ID ${ppnsDataPns.id} dengan layanan ${layanan.nama} belum memiliki ${relasi.message}, silakan lengkapi ${relasi.message} terlebih dahulu`,
          400,
        );
      }

      //jika belum ada upload
      const uploads = (ppnsDataPns as any).ppns_upload;
      if (!uploads || uploads.length === 0) {
        throw new HttpException(
          `Data calon ppns dengan ID ${ppnsDataPns.id} dengan layanan ${layanan.nama} belum memiliki upload dokumen, silakan lengkapi upload dokumen terlebih dahulu`,
          400,
        );
      }
    }

    //update statusnya
    await this.suratRepository.updateStatusPpnsSurat(
      createRequest.id_surat,
      true,
    );

    // Return sukses
    return {
      message: `Permohonan Ppns Surat dengan ID ${createRequest.id_surat} berhasil dikirim ke verifikator`,
    };
  }

  async storeCalonPpns(
    request: any,
    authorization?: string,
  ): Promise<CreateResponsePpnsDataPnsDto> {
    this.logger.debug(
      'Request Creating create calon pemohon',
      { request },
    );

    // Handle if body is empty
    if (!request || Object.keys(request).length === 0) {
      this.logger.error('Request body is empty');
      throw new BadRequestException('Request body cannot be empty');
    }

    const createRequest = this.validationService.validate(
      SuratValidation.CREATE_CALON_PPNS,
      request,
    );

    //get user login
    const userLogin = await getUserFromToken(authorization);
    if (!userLogin) {
      this.logger.error('Authorization token is missing');
      throw new BadRequestException('Authorization is missing');
    }

    const existingSurat = await this.suratRepository.findPpnSuratById(
      Number(createRequest.id_surat),
    );

    if (!existingSurat) {
      throw new HttpException(
        `Data Ppns surat dengan ID ${createRequest.id_surat} tidak ditemukan`,
        400,
      );
    }

    //cek jika statusnya true, berarti sudah dikirim ke verifikator
    if (existingSurat.status === true) {
      throw new HttpException(
        `Data Ppns surat dengan ID ${createRequest.id_surat} sudah dikirim ke verifikator tidak bisa ditambahkan calon ppns`,
        400,
      );
    }

    const surat = await this.prismaService.ppnsSurat.findFirst({
      where: {
        id: createRequest.id_surat,
      },
      select: {
        id_layanan: true,
      },
    });

    //validasi pangkat golongan
    const pangkatGolongan =
      await this.dataMasterRepository.findPangkatGolonganById(
        Number(createRequest.identitas_pns.pangkat_golongan),
      );

    if (!pangkatGolongan) {
      throw new NotFoundException(
        `Pangkat Golongan with ID ${createRequest.identitas_pns.pangkat_golongan} not found`,
      );
    }

    //validasi wilayah kerja
    await Promise.all(
      createRequest.wilayah_kerja.map((w: any) =>
        validateWilayah(this.dataMasterRepository, {
          idProvinsi: w.provinsi,
          idKabupaten: w.kab_kota,
          idKecamatan: w.kecamatan,
          idKelurahan: w.kelurahan || undefined,
        }),
      ),
    );

    //gabung gelar depan dan gelar belakang dengan underscore jika ada
    const gelarDepan = createRequest.identitas_pns.gelar_depan
      ? createRequest.identitas_pns.gelar_depan
          .split(',')
          .map((g) => g.trim())
          .join('_')
      : '';

    const gelarBelakang = createRequest.identitas_pns.gelar_belakang
      ? createRequest.identitas_pns.gelar_belakang
          .split(',')
          .map((g) => g.trim())
          .join('_')
      : '';

    // ["abc", "def"].join(" ") // "abc,def"

    // gabungkan dengan `;` hanya jika keduanya ada
    const namaGelar =
      gelarDepan && gelarBelakang
        ? `${gelarDepan};${gelarBelakang}`
        : gelarDepan || gelarBelakang;

    const createData = {
      id: createRequest.id || undefined,
      nama: createRequest.identitas_pns.nama,
      nip: createRequest.identitas_pns.nip,
      nama_gelar: namaGelar,
      gelar_depan: createRequest.identitas_pns.gelar_depan,
      jabatan: createRequest.identitas_pns.jabatan,
      pangkat_golongan: createRequest.identitas_pns.pangkat_golongan,
      jenis_kelamin: this.mapJenisKelamin(
        createRequest.identitas_pns.jenis_kelamin,
      ),
      agama: createRequest.identitas_pns.agama,
      nomor_hp: createRequest.identitas_pns.nomor_hp,
      email: createRequest.identitas_pns.email,
      // nama_sekolah: createRequest.identitas_pns.nama_sekolah,
      // gelar_terakhir: createRequest.identitas_pns.gelar_terakhir,
      // no_ijazah: createRequest.identitas_pns.no_ijazah,
      // tgl_ijazah: createRequest.identitas_pns.tgl_ijazah, // sudah Date dari Zod
      // tahun_lulus: createRequest.identitas_pns.tahun_lulus,
      is_ppns: false,

      ppns_surat: {
        connect: { id: createRequest.id_surat },
      },

      // nested create relasi
      ppns_wilayah_kerja: {
        create: createRequest.wilayah_kerja.map((w: any) => {
          const [uu1, uu2, uu3] = w.uu_dikawal;
          return {
            id_surat: createRequest.id_surat,
            id_layanan: surat?.id_layanan || null,
            penempatan_baru: w.penempatan_baru,
            uu_dikawal_1: uu1 ?? null,
            uu_dikawal_2: uu2 ?? null,
            uu_dikawal_3: uu3 ?? null,
          };
        }),
      },
    };

    const existingPpnsDataPns =
      await this.suratRepository.findPpnsDataPnsByIdSurat(
        createRequest.id_surat,
      );

    // savedata calon ppns
    const result = await this.suratRepository.savePpnsDataPns({
      ...createData,
      id_surat: createRequest.id_surat,
      provinsi_penempatan: Number(
        createRequest.lokasi_penempatan.provinsi_penempatan,
      ),
      kabupaten_penempatan: Number(
        createRequest.lokasi_penempatan.kabupaten_penempatan,
      ),
      unit_kerja: createRequest.lokasi_penempatan.unit_kerja,
      created_by: userLogin.user_id,
      kartu_tanda_penyidik_no_ktp: createRequest.kartu_tanda_penyidik?.no_ktp ?? null,
      kartu_tanda_penyidik_tgl_ktp: createRequest.kartu_tanda_penyidik?.tgl_ktp ?? null,
      karta_tanda_penyidik_tgl_berlaku_ktp:
        createRequest.kartu_tanda_penyidik?.tgl_berlaku_ktp ?? null,
    });
    // }

    //update id_ppns di ppns_upload yang id_ppns null dan id_surat sama dengan createRequest.id_surat
    await this.suratRepository.updatePpnsUploadIdPpns(
      Number(createRequest.id_surat),
      Number(result.id),
    );

    return result;
  }

  async getListSurat(
    request: SuratPaginationDto,
    authorization: string,
  ): Promise<GetSuratPaginationDto> {
    this.logger.debug('Fetching list permohonan verifikasi surat', { request });

    // 1️⃣ Validasi input
    const getRequest = this.validationService.validate(
      SuratValidation.GET_SURAT_PAGINATION,
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
      this.suratRepository.findAllWithPaginationSurat(
        getRequest.layanan,
        getRequest.search,
        getRequest.page,
        getRequest.limit,
        getRequest.orderBy,
        getRequest.orderDirection,
        getRequest.filters,
        userLogin.user_id,
      ),
      this.suratRepository.countSurat(
        getRequest.layanan,
        getRequest.search,
        userLogin.user_id,
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
      })),
      pagination,
    };
  }

  private mapJenisKelamin(
    value: string | null | undefined,
  ): jenis_kelamin_enum | null {
    if (!value) return null;
    const lower = value.toLowerCase();
    if (lower === 'pria') return 'pria';
    if (lower === 'wanita') return 'wanita';
    return null; // fallback kalau invalid
  }
}
