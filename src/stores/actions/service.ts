import api from '@/api';
import { StoreMain, ActionsService } from '@/stores/types';
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

	const onServerOut = (): void => {
		store.online.value = false;
		store.updateSavedStatus();
		store.setMessage(
			store.t.value.i.text.offline + '\n' +
			store.t.value.i.text.offlineSaving
		, 5);
	};
	const onServerOn = (): void => {
		store.online.value = true;
		store.updateSavedStatus();
		store.setMessage(
			store.t.value.i.text.online + '\n' +
			store.t.value.i.text.onlineSaving
		, 5);
	};
	const setOffline = (offlineMode?: boolean): void => {
		store.offlineMode.value = offlineMode ?? true;
		if (offlineMode) onServerOut();
		store.setMessage(
			offlineMode
				? store.t.value.i.text.offline + '\n' + store.t.value.i.text.offlineSaving
				: store.t.value.i.text.online + '\n' + store.t.value.i.text.onlineSaving
		, 5);
	};
	const setPointAltitude = async (entity: Point): Promise<void> => {
		const id = entity.id;
		const lat = entity.latitude;
		const lng = entity.longitude;
		try {
			const alt = await getAltitude(lat, lng);
			if (alt === null) return;
			const point = store.getPointById(id);
			if (!point) return;
			if (point.latitude === lat && point.longitude === lng) point.altitude = alt;
		} catch {
			return;
		}
	};

	return {
		onServerOut,
		onServerOn,
		setOffline,
		setPointAltitude,
	};
};
