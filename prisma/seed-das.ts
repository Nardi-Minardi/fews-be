import { PrismaClient } from '../node_modules/.prisma/main-client';
import * as fs from 'fs/promises';
import * as path from 'path';

const prisma = new PrismaClient();

type Feature = {
	type: 'Feature';
	geometry: { type: string; coordinates: any } | null;
	properties?: Record<string, any> | null;
};

type FeatureCollection = {
	type: 'FeatureCollection';
	features: Feature[];
};

const GEOJSON_DIR = path.resolve(__dirname, '../src/data/geojson');

const FILE_PROV_MAP: Record<string, string> = {
	'CIMANUK-CISANGGARUNG.geojson': '32', // Jawa Barat
	'JRATUNSELUNA.geojson': '33', // Jawa Tengah
};

function toStr(v: any): string | null {
	if (v === undefined || v === null) return null;
	return String(v);
}

function toNum(v: any): number | null {
	const n = Number(v);
	return Number.isFinite(n) ? n : null;
}

async function readGeoJSON(filePath: string): Promise<FeatureCollection> {
	const raw = await fs.readFile(filePath, 'utf8');
	return JSON.parse(raw) as FeatureCollection;
}

function normalizeCode(code: string | null | undefined): string | null {
	if (!code) return null;
	return String(code).replace(/\./g, '');
}

function pickProp(obj: Record<string, any>, candidates: string[]): string | null {
	for (const key of candidates) {
		if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
			return String(obj[key]);
		}
	}
	return null;
}

function strHash(s: string): number {
	let h = 0;
	for (let i = 0; i < s.length; i++) {
		h = (h * 31 + s.charCodeAt(i)) | 0;
	}
	return Math.abs(h);
}

async function seedFile(fileName: string) {
	const fullPath = path.join(GEOJSON_DIR, fileName);
	const provCode = FILE_PROV_MAP[fileName] ?? null;
	const data = await readGeoJSON(fullPath);

	console.log(`[seed-das] ${fileName}: ${data.features.length} features`);

		// Preload administrative hierarchy for the province (if available)
		const kabList = provCode
			? await prisma.m_kab_kota.findMany({
					where: { provinsi_code: provCode },
					select: { code: true },
					orderBy: { code: 'asc' },
				})
			: [];
		const kecByKab = new Map<string, string[]>();
		const kelByKec = new Map<string, string[]>();

		async function getKecList(kabCode: string | null | undefined): Promise<string[]> {
			if (!kabCode) return [];
			const cached = kecByKab.get(kabCode);
			if (cached) return cached;
			const rows = await prisma.m_kecamatan.findMany({
				where: { kab_kota_code: kabCode },
				select: { code: true },
				orderBy: { code: 'asc' },
			});
			const arr = rows.map(r => r.code!).filter(Boolean);
			kecByKab.set(kabCode, arr);
			return arr;
		}

		async function getKelList(kecCode: string | null | undefined): Promise<string[]> {
			if (!kecCode) return [];
			const cached = kelByKec.get(kecCode);
			if (cached) return cached;
			const rows = await prisma.m_kel_des.findMany({
				where: { kecamatan_code: kecCode },
				select: { code: true },
				orderBy: { code: 'asc' },
			});
			const arr = rows.map(r => r.code!).filter(Boolean);
			kelByKec.set(kecCode, arr);
			return arr;
		}

			let inserted = 0;
			let assignedKab = 0, assignedKec = 0, assignedKel = 0;
			for (let idx = 0; idx < data.features.length; idx++) {
			const f = data.features[idx];
		if (!f || !f.geometry) continue;
		const props = f.properties ?? {};

    const uid = toStr(props.id);
		const kode_das = toStr(props.kode_das);
		const name = toStr(props.name);
		const luas = toNum(props.luas);
		const ws_uid = toStr(props.ws_id);
		const color = toStr(props.color);

		// Dynamically capture administrative codes if provided in GeoJSON properties
			const kabKotaRaw = pickProp(props, ['kab_kota_code', 'kabkota_code', 'kab_code', 'kabupaten_code', 'regency_code']);
			const kecRaw = pickProp(props, ['kecamatan_code', 'kec_code', 'district_code']);
			const kelRaw = pickProp(props, ['kel_des_code', 'kelurahan_code', 'kel_code', 'desa_code', 'village_code']);
			let kab_kota_code = normalizeCode(kabKotaRaw);
			let kecamatan_code = normalizeCode(kecRaw);
			let kel_des_code = normalizeCode(kelRaw);

			// If not provided in GeoJSON, derive dynamically from wilayah hierarchy of the province
				if (!kab_kota_code && provCode && kabList.length) {
					const key = uid ?? kode_das ?? name ?? `${idx}`;
					const pickKab = kabList[strHash(key) % kabList.length]?.code ?? null;
				kab_kota_code = pickKab;
					if (kab_kota_code) assignedKab++;
			}
			if (!kecamatan_code && kab_kota_code) {
				const kecList = await getKecList(kab_kota_code);
				if (kecList.length) {
						const key = uid ?? kode_das ?? name ?? `${idx}`;
						const pickKec = kecList[strHash(key + ':kec') % kecList.length];
					kecamatan_code = pickKec ?? null;
						if (kecamatan_code) assignedKec++;
				}
			}
			if (!kel_des_code && kecamatan_code) {
				const kelList = await getKelList(kecamatan_code);
				if (kelList.length) {
						const key = uid ?? kode_das ?? name ?? `${idx}`;
						const pickKel = kelList[strHash(key + ':kel') % kelList.length];
					kel_des_code = pickKel ?? null;
						if (kel_des_code) assignedKel++;
				}
			}

		const geomJson = JSON.stringify({
			type: f.geometry.type,
			coordinates: f.geometry.coordinates,
		});

	    try {
	      await prisma.$executeRaw`
					INSERT INTO "m_das" (
						"das_uid", "kode_das", "name", "luas", "ws_uid", "color", "geom",
						"provinsi_code", "kab_kota_code", "kecamatan_code", "kel_des_code"
					) VALUES (
						${uid}, ${kode_das}, ${name}, ${luas}, ${ws_uid}, ${color}, ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326),
						${provCode}, ${kab_kota_code}, ${kecamatan_code}, ${kel_des_code}
					)
				`;
			inserted++;
		  if (inserted % 100 === 0) console.log(`[seed-das] ${fileName}: inserted ${inserted}`);
		} catch (e: any) {
			console.error('[seed-das] insert error', { fileName, name, kode_das, message: e?.message });
		}
	}

	  console.log(`[seed-das] ${fileName}: done, inserted ${inserted}, assigned kab=${assignedKab}, kec=${assignedKec}, kel=${assignedKel}`);
}

async function main() {
	console.log('[seed-das] starting...');

	// Clean table
		await prisma.$executeRaw`DELETE FROM "m_das"`;

	// Seed known files only (explicit mapping ensures correct province assignment)
	for (const file of Object.keys(FILE_PROV_MAP)) {
		try {
			await seedFile(file);
		} catch (e: any) {
			console.error(`[seed-das] failed for ${file}:`, e?.message || e);
		}
	}

	console.log('[seed-das] done');
}

main()
	.catch((e) => {
		console.error('[seed-das] error', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

