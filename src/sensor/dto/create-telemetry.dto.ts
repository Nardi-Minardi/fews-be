export class PayloadTelemetryDto {
  device_id: string; //ID unik dari alat (biasanya UID, SN, atau IMEI).
  name: string; //Nama lokasi atau deskripsi alat.
  // device_type: string; //Jenis alat (AWLR, ARR, AWS, dll).
  device_status: string; //Status operasional alat (Online, Offline, Maintenance).
  timestamp: string; //Timestamp UTC ISO8601 saat terakhir mengirim data.
  last_battery: number; //Tegangan baterai terakhir yang dilaporkan (dalam Volt).
  last_signal: number; //Kekuatan sinyal terakhir yang dilaporkan (dalam dBm).
  lat: number; //Koordinat lintang lokasi alat.
  long: number; //Koordinat bujur lokasi alat.
  value: number;
  cctv_url?: string; //URL opsional untuk umpan CCTV terkait alat.
  hidrologi_type?: string;
  das_id?: number | null;
  device_tag_id?: number[];
  sensors: Array<{
    sensor_id: string; //ID unik sensor yang terpasang pada alat.
    name: string; //Nama deskriptif sensor (misalnya, "Fluid Level Sensor" etc).
    unit: string; //Unit pengukuran sensor (misalnya, "cm", "Celsius", "mm/h", dll).
    sensor_type?: string; //Jenis sensor opsional (misalnya, "rain_fall", "water_level", "temperature", dll).
    value: number; //Nilai pengukuran sensor.
    value_change?: number;
    criteria_id?: number;
    criteria_status?: number;
    elevation?: number; //Elevasi opsional dari sensor (jika berlaku).
    years_data?: number[]; //Array opsional berisi data historis tahunan (jika berlaku).
    debit?: number; //Debit opsional yang dihitung berdasarkan nilai sensor (jika berlaku).
  }>;
}

// 🔹 1. value di level device

// ➡️ Ini adalah nilai utama atau nilai ringkasan dari perangkat.

// Biasanya merepresentasikan parameter utama yang dipantau oleh perangkat tersebut.

// Misal:

// Kalau device_type = "AWLR" → maka value umumnya = tinggi muka air (cm) terakhir.

// Kalau device_type = "ARR" → maka value = curah hujan (mm) terakhir.

// Kalau device_type = "AWS" → bisa saja value = salah satu parameter utama seperti suhu rata-rata atau curah hujan harian.

// 📌 Jadi value di level device adalah nilai ringkasan utama (summary) yang paling penting untuk ditampilkan cepat di dashboard (misalnya di peta atau list device).

// 🔹 2. value di level sensor

// ➡️ Ini adalah nilai individual dari tiap sensor yang terpasang pada perangkat tersebut.

// Satu perangkat bisa punya banyak sensor (contoh: tinggi muka air, curah hujan, suhu, kelembapan, dsb).

// Tiap sensor punya sensor_type, unit, dan value masing-masing.

// Digunakan untuk analisis lebih detail, grafik, dan penyimpanan multi-parameter di database.

// 3. Kadang device.value adalah hasil olahan dari beberapa sensor

// Misalnya perangkat AWS (Automatic Weather Station) punya banyak sensor:

// suhu (temperature)

// kelembapan (humidity)

// tekanan udara (pressure)

// Maka device.value bisa jadi:

// Rata-rata dari beberapa sensor

// Nilai yang dihitung (misal indeks panas / heat index)

// Nilai prioritas tertentu (misalnya suhu udara)

// Perangkat cukup kirim satu nilai utama (lebih simpel untuk perangkat IoT dengan resource terbatas).

// Cocok kalau logger-nya sudah memiliki logika sendiri (misal sudah hitung rata-rata atau filter noise).
