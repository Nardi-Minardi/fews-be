import { PrismaClient } from '.prisma/main-client/client';

const prisma = new PrismaClient();

const TAG_MAP = {
  'CURAH HUJAN': 1, // ARR
  'DUGA AIR': 2, // AWLR
  KLIMATOLOGI: 3, // AWS
};

async function main() {
  console.log('[seed-device] starting...');

  try {
    const res = await fetch(
      'https://sihka.dev-tunnels.id/api/v1/pos/cimancis_pemali',
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: gagal ambil data`);

    const json: any = await res.json();
    const data = Array.isArray(json.data) ? json.data : [json.data];

    console.log(`[seed-device] fetched ${data.length} items`);

    for (const item of data) {
      const tagId = TAG_MAP[item.hidrologi_type?.toUpperCase()] || null;
      const device_status = Math.random() < 0.9 ? 'Online' : 'Offline';

      //find das_id in table m_das by das_name include matching das_name
      let das = await prisma.m_das.findFirst({
        where: {
          name: { contains: item.das_name || '', mode: 'insensitive' },
        },
      });
      let das_id = das ? das.id : null;

      // parsing coordinate
      let lat: number | null = null;
      let long: number | null = null;
      const coord = String(item.coordinate || '');
      const parts = coord.split(',');
      if (parts.length === 2) {
        const parsedLong = parseFloat(parts[0]);
        const parsedLat = parseFloat(parts[1]);
        if (!isNaN(parsedLat)) lat = parsedLat;
        if (!isNaN(parsedLong)) long = parsedLong;
      }

      try {
        // 🔹 Upsert ke m_device
        const device = await prisma.m_device.upsert({
          where: { device_uid: item.id },
          update: {
            name: item.name,
            owner: item.pengelola_name,
            hidrologi_type: item.hidrologi_type,
            device_tag_id: tagId !== null ? [tagId] : undefined,
            lat,
            long,
            last_sending_data: null,
            device_status,
            das_id,
            das_name: item.das_name || null,
            updated_at: new Date(),
          },
          create: {
            device_uid: item.id,
            name: item.name,
            owner: item.pengelola_name,
            hidrologi_type: item.hidrologi_type,
            device_tag_id: tagId !== null ? [tagId] : undefined,
            lat,
            long,
            last_sending_data: null,
            device_status,
            das_id,
            das_name: item.das_name || null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        console.log(
          `[seed-device] upserted device: ${item.id} (${item.name}) → id=${device.id}`,
        );

        // 🔹 Insert sensors (m_sensor)
        if (Array.isArray(item.sensor)) {
          for (const s of item.sensor) {
            try {
              await prisma.m_sensor.upsert({
                where: { sensor_uid: s.id },
                update: {
                  name: s.name,
                  sensor_type: s.type,
                  sensor_key: String(s.sensor_key),
                  device_uid: item.id,
                  device_id: device.id, // ✅ ambil dari hasil upsert device
                  unit: s.unit || '',
                  years_data: s.years_data || [],
                  updated_at: new Date(),
                },
                create: {
                  sensor_uid: s.id,
                  name: s.name,
                  sensor_type: s.type,
                  sensor_key: String(s.sensor_key),
                  device_uid: item.id,
                  device_id: device.id, // ✅ ambil dari hasil upsert device
                  unit: s.unit || '',
                  years_data: s.years_data || [],
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              });

              console.log(
                `  ↳ [sensor] ${s.id} (${s.name}) type=${s.type} key=${s.sensor_key}`,
              );
            } catch (sensorErr: any) {
              console.error(
                `  ⚠️ [sensor] gagal insert ${s.id}:`,
                sensorErr.message || sensorErr,
              );
            }
          }
        }
      } catch (err: any) {
        console.error(
          `[seed-device] failed for ${item.id}:`,
          err.message || err,
        );
      }
    }

    console.log('[seed-device] done ✅');
  } catch (err: any) {
    console.error('[seed-device] error:', err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
