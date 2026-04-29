import { roundTo } from '@/shared/common';
import { Point } from '@/types';

export const normalizeLon = (longitude: number): number => {
	return ((longitude + 180) % 360 + 360) % 360 - 180;
};
export const normalizeLat = (latitude: number): number => {
	let x = ((latitude + 90) % 360 + 360) % 360 - 90;
	if (x > 90) x = 180 - x;
	if (x < -90) x = -180 - x;
	return x;
};
export const deg2dms = (frac: number): number[] => {
	if (!Number.isFinite(frac)) return [ NaN, NaN, NaN ];
	const absFrac = Math.abs(frac);
	let d = Math.floor(absFrac);
	const minFull = (absFrac - d) * 60;
	let m = Math.floor(minFull);
	let s = Math.round((minFull - m) * 60 * 100) / 100;
	if (s >= 60) { s = 0; m += 1; }
	if (m >= 60) { m = 0; d += 1; }
	return [ frac < 0 ? -d : d, m, s ];
};
export const dms2deg = (dms: number[]): number => {
	const [ d, m = 0, s = 0 ] = dms;
	if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(s)) return NaN;
	return roundTo((Math.abs(d) + m / 60 + s / 3600) * (d < 0 ? -1 : 1));
};
export const coords2string = (coords: number[]): string => {
	const lat = normalizeLat(coords[0]);
	const lon = normalizeLon(coords[1]);
	const format = (deg: number, pos: string, neg: string) => {
		const dms = deg2dms(Math.abs(deg));
		return `${dms[0]}°${dms[1]}'${dms[2].toFixed(2)}"${deg < 0 ? neg : pos}`;
	};
	return `${format(lat, 'N', 'S')}, ${format(lon, 'E', 'W')}`;
};
export const latitude2string = (latitude: number): string => {
	const lat = normalizeLat(latitude);
	const [ d, m, s ] = deg2dms(lat);
	return `${Math.abs(d)}°${m}'${s.toFixed(2)}"${lat < 0 ? 'S' : 'N'}`;
};
export const longitude2string = (longitude: number): string => {
	const lon = normalizeLon(longitude);
	const [ d, m, s ] = deg2dms(lon);
	return `${Math.abs(d)}°${m}'${s.toFixed(2)}"${lon < 0 ? 'W' : 'E'}`;
};
export const string2coords = (coords: string): number[] | null => {
	const parseSafe = (v: string | undefined): number => {
		if (!v) return 0;
		const n = parseFloat(v.replace(/,/, '.'));
		return Number.isFinite(n) ? n : 0;
	};
	const re = /\s*°\s*(?:(\d{1,2}(?:[.,]\d+)?)\s*['′])?\s*(?:(\d{1,2}(?:[.,]\d+)?)\s*["″])?\s*/;
	const reLat = new RegExp('(\\d{1,2})' + re.source + '([nNsSсСюЮ])', 'i');
	const reLon = new RegExp('(\\d{1,3})' + re.source + '([eEwWвВзЗ])', 'i');
	const latMatch = coords.match(reLat);
	const lonMatch = coords.match(reLon);
	if (!latMatch || !lonMatch) return null;
	const latVals = latMatch.slice(1, 4).map(parseSafe);
	const lonVals = lonMatch.slice(1, 4).map(parseSafe);
	const isSouth = /[sSюЮ]/.test(latMatch[4]);
	const isWest = /[wWзЗ]/.test(lonMatch[4]);
	return [
		dms2deg(latVals) * (isSouth ? -1 : 1),
		dms2deg(lonVals) * (isWest ? -1 : 1),
	];
};
export const point2coords = (p: Point, m: string, h: string): string => {
	return (
		coords2string([ p.latitude, p.longitude ]) +
		(typeof p.altitude === 'number' ? `, ${h} ${p.altitude} ${m}` : '')
	);
}
