import api from '@/api';

const FALLBACK_API = (lat: number, lon: number) =>
	`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`;

export const serviceActions = {
	async getAltitude (lat: number, lon: number): Promise<number | null> {
		async function fetchAltitude(
			url: string,
			parseFn: (data: any) => number | null,
		) {
			try {
				const { data } = await api.get(url, { silent: true });
				return parseFn(data);
			} catch {
				return null;
			}
		}
		function parseOpenMeteo(data: any) {
			if (Array.isArray(data.elevation)) {
				const alt = Number(data.elevation[0]);
				return isNaN(alt) ? null : alt;
			}
			if (typeof data.elevation === 'number') {
				return data.elevation;
			}
			return null;
		}
		function parseOpenElevation(data: any) {
			const alt = data?.results?.[0]?.elevation;
			return typeof alt === 'number' ? alt : null;
		}
		const primaryUrl = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;
		let alt = await fetchAltitude(primaryUrl, parseOpenMeteo);
		if (alt !== null) return alt;
		const fallbackUrl = FALLBACK_API(lat, lon);
		alt = await fetchAltitude(fallbackUrl, parseOpenElevation);
		return alt;
	}
};
