import { PrismaClient } from '../node_modules/.prisma/main-client';

const prisma = new PrismaClient();

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

async function main() {
  console.log('[seed-device] starting...');

  const dasList = await prisma.m_das.findMany({
    select: { id: true, name: true },
  });
  if (dasList.length === 0) {
    console.warn(
      '[seed-device] No m_das rows found. Please run prisma:seed:das first.',
    );
    return;
  }

  const tags = await prisma.m_device_tag.findMany({
    select: { id: true, name: true },
    orderBy: { id: 'asc' },
  });
  const tagIdByName = new Map(tags.map((t) => [t.name, t.id] as const));
  const typeCycle = ['ARR', 'AWS', 'AWLR'] as const;
  const suffixByType: Record<(typeof typeCycle)[number], string> = {
    ARR: 'Curah Hujan',
    AWLR: 'Level Water & Curah Hujan',
    AWS: 'AWS (Klimatologi)',
  };
  // Map device tag/type to human-friendly name_type
  const nameTypeByType: Record<string, string> = {
    ARR: 'PCH',
    AWS: 'Pos Cuaca',
    AWLR: 'PDA',
    AWLRD: 'PDA', // in case AWLRD tag/type exists
  };
  const siteSeeds = [
    'Pakis',
    'Bd.Kedungombo',
    'WD.Jatibarang',
    'Plumbon',
    'Kuta',
    'Boloagung',
    'Rahtawu',
    'Banyumeneng',
    'Wd.Cacaban',
    'Prawoto',
    'Klegung',
    'Cipamokolan',
    'Cisangkan',
    'Cipeusing',
    'Cikapundung',
    'Citarum',
    'Cibeet',
    'Cisadane',
    'Cimanuk',
    'Citanduy',
  ];

  // Optional: clean existing devices
  await prisma.m_device.deleteMany({});

  const owners = [
    'BMKG Pusat',
    'BBWS',
    'Pemkot Bandung',
    'Pemkab Bogor',
    'BPBD Jabar',
  ];
  const statuses = ['Online', 'Offline'];

  const now = new Date();
  const records = Array.from({ length: 50 }).map((_, i) => {
    const das = dasList[i % dasList.length];
    const type = typeCycle[i % typeCycle.length];
    const tagId = tagIdByName.get(type) ?? null;
    const site = siteSeeds[i % siteSeeds.length];
    const suffix = suffixByType[type];
    const lat = rand(-7.1, -6.1);
    const lon = rand(106.5, 108.9);
    const tagIds: number[] = [];
    if (type === 'AWS') {
      // Example: AWS can have AWS + ARR similar to FE sample
      const ids = ['AWS', 'ARR']
        .map((k) => tagIdByName.get(k))
        .filter((v): v is number => typeof v === 'number');
      tagIds.push(...ids);
    } else {
      if (tagId) tagIds.push(tagId);
    }
    return {
      device_uid: `DEV-${(i + 1).toString().padStart(4, '0')}`,
      device_tag_id: tagIds,
      das_id: das.id,
      sungai_id: null,
      owner: randomOf(owners),
      name: `${site} - ${suffix}`,
      name_type: nameTypeByType[type] ?? null,
      device_status: randomOf(statuses),
      last_sending_data: new Date(
        now.getTime() - Math.floor(rand(0, 7 * 24)) * 3600 * 1000,
      ),
      last_battery: rand(20, 100).toFixed(2),
      last_signal: rand(-110, -60).toFixed(2),
      lat: parseFloat(lat.toFixed(6)),
      long: parseFloat(lon.toFixed(6)),
      cctv_url: null,
      value: rand(0, 500).toFixed(2),
      created_at: now,
      updated_at: now,
    };
  });

  let inserted = 0;
  for (const data of records) {
    await prisma.m_device.create({ data });
    inserted++;
  }
  console.log(`[seed-device] inserted ${inserted} devices`);
  console.log('[seed-device] done');
}

main()
  .catch((e) => {
    console.error('[seed-device] error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
