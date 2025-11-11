import { PrismaClient } from '.prisma/main-client/client';

const prisma = new PrismaClient();

// Mapping hidrologi_type → device_tag_id
const TAG_MAP = {
  'CURAH HUJAN': 1, // ARR
  'DUGA AIR': 2, // AWLR
  'KLIMATOLOGI': 3, // AWS
};

async function main() {
  console.log('[seed-device] starting...');

  try {
    // 1️⃣ Ambil data dari API eksternal
    const res = await fetch(
      'https://sihka.dev-tunnels.id/api/v1/pos/cimancis_pemali',
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}: gagal ambil data`);

    const json: any = await res.json();
    const data = Array.isArray(json.data) ? json.data : [json.data];

    console.log(`[seed-device] fetched ${data.length} items`);

    // 2️⃣ Loop tiap item dan upsert ke m_device
    for (const item of data) {
      const tagId = TAG_MAP[item.hidrologi_type?.toUpperCase()] || null;

      // Dummy latitude & longitude (sekitar Jawa Tengah)
      const lat =
        typeof item.lat === 'number' ? item.lat : -7.0 + Math.random() * 0.5;
      const long =
        typeof item.long === 'number' ? item.long : 110.0 + Math.random() * 0.5;

      // Dummy last_sending_data (1–60 menit lalu)
      const minutesAgo = Math.floor(Math.random() * 60) + 1;
      const lastSending = new Date(Date.now() - minutesAgo * 60 * 1000);

      try {
        await prisma.m_device.upsert({
          where: { device_uid: item.id },
          update: {
            name: item.name,
            owner: item.pengelola_name,
            hidrologi_type: item.hidrologi_type,
            device_tag_id: tagId !== null ? [tagId] : undefined,
            lat,
            long,
            last_sending_data: lastSending,
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
            last_sending_data: lastSending,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        console.log(
          `[seed-device] upserted ${item.id} (${item.name}) tag=${tagId}, lat=${lat.toFixed(
            5,
          )}, long=${long.toFixed(5)}, last_sending=${lastSending.toISOString()}`,
        );
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
