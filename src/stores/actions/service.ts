import { StoreMain, ActionsService } from '@/stores/types';
import api from '@/api';
import { Point } from '@/types';

const FALLBACK_API = (lat: number, lon: number) =>
	`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`
;
interface OpenMeteoResponse {
	elevation?: number | unknown[];
}
interface OpenElevationResponse {
	results?: Array<{ elevation?: number }>;
}

async function getAltitude(lat: number, lon: number): Promise<number | null> {
	const primaryUrl = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;
	let alt = await fetchAltitude(primaryUrl, parseOpenMeteo);
	if (alt !== null) return alt;
	const fallbackUrl = FALLBACK_API(lat, lon);
	alt = await fetchAltitude(fallbackUrl, parseOpenElevation);
	return alt;
};
async function fetchAltitude(
	url: string,
	parseFn: (data: unknown) => number | null,
) {
	try {
		const { data } = await api.get(url, { silent: true });
		return parseFn(data);
	} catch {
		return null;
	}
}
export function parseOpenMeteo(data: unknown) {
	const d = data as OpenMeteoResponse | null;
	if (Array.isArray(d?.elevation)) {
		const alt = Number(d.elevation[0]);
		return isNaN(alt) ? null : alt;
	}
	if (typeof d?.elevation === 'number') {
		return d.elevation;
	}
	return null;
}
export function parseOpenElevation(data: unknown) {
	const d = data as OpenElevationResponse | null;
	const alt = d?.results?.[0]?.elevation;
	return typeof alt === 'number' ? alt : null;
}

export function useActionsService(
	store: StoreMain,
): ActionsService {

	const setPointAltitude = async (entity: Point): Promise<void> => {
		const id = entity.id;
		const lat = entity.latitude;
		const lng = entity.longitude;
		getAltitude(lat, lng)
			.then((alt: number | null) => {
				if (alt === null) return;
				const point = store.getPointById(id);
				if (!point) return;
				if (point.latitude === lat && point.longitude === lng) point.altitude = alt;
			})
			.catch(() => {})
		;
	};

	return {
		setPointAltitude,
	};
};
