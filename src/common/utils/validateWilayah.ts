// src/utils/validateWilayah.ts
import { NotFoundException } from '@nestjs/common';

type Repository = {
  findProvinsiById: (id: string | number) => Promise<any>;
  findKabupatenById: (id: string | number) => Promise<any>;
  findKecamatanById: (id: string | number) => Promise<any>;
  findKelurahanById: (id: string | number) => Promise<any>;
};


type InformasiAlamat = {
  idProvinsi: number;
  idKabupaten: number;
  idKecamatan: number;
  idKelurahan: number;
};

export async function validateWilayah(
  repo: Repository,
  alamat: InformasiAlamat,
) {
  const provinsi = await repo.findProvinsiById(alamat.idProvinsi);
  if (!provinsi) {
    throw new NotFoundException(
      `Provinsi dengan ID ${alamat.idProvinsi} tidak ditemukan di database`,
    );
  }

  const kabupaten = await repo.findKabupatenById(alamat.idKabupaten);
  if (!kabupaten) {
    throw new NotFoundException(
      `Kabupaten dengan ID ${alamat.idKabupaten} tidak ditemukan di database`,
    );
  }

  const kecamatan = await repo.findKecamatanById(alamat.idKecamatan);
  if (!kecamatan) {
    throw new NotFoundException(
      `Kecamatan dengan ID ${alamat.idKecamatan} tidak ditemukan di database`,
    );
  }

  const kelurahan = await repo.findKelurahanById(alamat.idKelurahan);
  if (!kelurahan) {
    throw new NotFoundException(
      `Kelurahan dengan ID ${alamat.idKelurahan} tidak ditemukan di database`,
    );
  }

  return { provinsi, kabupaten, kecamatan, kelurahan };
}
