export interface DAS {
  id: string;
  nama: string;
  provinsi_id: string; // e.g., 'jabar'
  koordinat: [number, number]; // [lat, lng]
  bounds: [[number, number], [number, number]]; // [[south, west], [north, east]]
  sungai_induk?: string; // optional main river name
}

// DAS list fokus Jawa Barat, diselaraskan dengan bounds provinsi di wilayah.data.ts
// Jawa Barat bounds: [[-7.7, 106.0], [-5.9, 109.0]]
export const DAS_DATA: DAS[] = [
  {
    id: 'das-citarum-hulu',
    nama: 'DAS Citarum Hulu',
    provinsi_id: 'jabar',
    koordinat: [-6.9651, 107.6339], // dekat Dayeuhkolot (PDA)
    bounds: [[-7.2, 107.3], [-6.7, 107.8]],
    sungai_induk: 'Citarum',
  },
  {
    id: 'das-citarum-tengah',
    nama: 'DAS Citarum Tengah',
    provinsi_id: 'jabar',
    koordinat: [-6.95, 107.4],
    bounds: [[-7.2, 107.2], [-6.7, 107.6]],
    sungai_induk: 'Citarum',
  },
  {
    id: 'das-citarum-hilir',
    nama: 'DAS Citarum Hilir',
    provinsi_id: 'jabar',
    koordinat: [-6.6, 107.2],
    bounds: [[-6.8, 107.0], [-6.4, 107.4]],
    sungai_induk: 'Citarum',
  },
  {
    id: 'das-cikapundung',
    nama: 'DAS Cikapundung',
    provinsi_id: 'jabar',
    koordinat: [-6.87, 107.61],
    bounds: [[-6.92, 107.58], [-6.80, 107.68]],
    sungai_induk: 'Cikapundung',
  },
  {
    id: 'das-cisangkuy',
    nama: 'DAS Cisangkuy',
    provinsi_id: 'jabar',
    koordinat: [-7.05, 107.58],
    bounds: [[-7.20, 107.50], [-6.90, 107.70]],
    sungai_induk: 'Cisangkuy',
  },
  {
    id: 'das-cimanuk',
    nama: 'DAS Cimanuk',
    provinsi_id: 'jabar',
    koordinat: [-6.8, 108.2],
    bounds: [[-7.2, 107.8], [-6.5, 108.6]],
    sungai_induk: 'Cimanuk',
  },
  {
    id: 'das-cisanggarung',
    nama: 'DAS Cisanggarung',
    provinsi_id: 'jabar',
    koordinat: [-6.75, 108.6],
    bounds: [[-7.0, 108.4], [-6.5, 108.9]],
    sungai_induk: 'Cisanggarung',
  },
  {
    id: 'das-ciliwung-hulu',
    nama: 'DAS Ciliwung Hulu',
    provinsi_id: 'jabar',
    koordinat: [-6.60, 106.80],
    bounds: [[-6.80, 106.70], [-6.40, 107.00]],
    sungai_induk: 'Ciliwung',
  },
  {
    id: 'das-cisadane',
    nama: 'DAS Cisadane',
    provinsi_id: 'jabar',
    koordinat: [-6.55, 106.75],
    bounds: [[-6.80, 106.50], [-6.30, 106.95]],
    sungai_induk: 'Cisadane',
  },
  {
    id: 'das-cimandiri',
    nama: 'DAS Cimandiri',
    provinsi_id: 'jabar',
    koordinat: [-6.92, 106.94],
    bounds: [[-7.20, 106.40], [-6.60, 107.10]],
    sungai_induk: 'Cimandiri',
  },
  {
    id: 'das-citanduy',
    nama: 'DAS Citanduy',
    provinsi_id: 'jabar',
    koordinat: [-7.35, 108.45],
    bounds: [[-7.70, 108.20], [-7.00, 108.80]],
    sungai_induk: 'Citanduy',
  },
];

export const getDasByProvinsi = (provinsi_id: string): DAS[] => {
  return DAS_DATA.filter((d) => d.provinsi_id === provinsi_id);
};

export const findDasByName = (nama: string): DAS | undefined => {
  const lower = nama.toLowerCase();
  return DAS_DATA.find((d) => d.nama.toLowerCase() === lower);
};
