import { isPlainTreeCorrect } from '@/shared/checkers';
import { Point, Folder } from '@/stores/types';

let resultForRecursive: unknown;

export const num2deg = (num: number, lat = false): number => {
	const n = num % 360;
	if (Math.abs(n) <= (lat ? 90 : 180)) return n;
	if (lat && Math.abs(n) < 180) return -n % 90 + 90 * (n < 0 ? -1 : 1);
	if (lat && Math.abs(n) < 270) return -n % 90;
	if (lat) return n % 90 + 90 * (n < 0 ? 1 : -1);
	return n % 180 + 180 * (n < 0 ? 1 : -1);
};
export const deg2degMinSec = (frac: number): number[] => {
	const deg = Math.trunc(frac);
	const minFrac = Math.abs(frac - deg) * 60;
	const min = Math.trunc(minFrac);
	const secFrac = (minFrac - min) * 60;
	return [deg, min, secFrac];
};
export const degMinSec2deg = (dms: number[]): number => {
	return (Math.abs(dms[0]) + dms[1] / 60 + dms[2] / 3600) * (dms[0] < 0 ? -1 : 1);
};
export const coords2string = (coords: number[]): string => {
	const lat = num2deg(coords[0], true);
	const lon = num2deg(coords[1]);
	const latDMS = deg2degMinSec(Math.abs(lat));
	const lonDMS = deg2degMinSec(Math.abs(lon));
	return (
		`${latDMS[0]}°${latDMS[1]}'${latDMS[2].toFixed(2)}"${lat < 0 ? 'S' : 'N'}, ` +
		`${lonDMS[0]}°${lonDMS[1]}'${lonDMS[2].toFixed(2)}"${lon < 0 ? 'W' : 'E'}`
	);
};
export const latitude2string = (latitude: number): string => {
	const lat = num2deg(latitude, true);
	const latDMS = deg2degMinSec(Math.abs(lat));
	return `${latDMS[0]}°${latDMS[1]}'${latDMS[2].toFixed(2)}"${lat < 0 ? 'S' : 'N'}`;
};
export const longitude2string = (longitude: number): string => {
	const lon = num2deg(longitude);
	const lonDMS = deg2degMinSec(Math.abs(lon));
	return `${lonDMS[0]}°${lonDMS[1]}'${lonDMS[2].toFixed(2)}"${lon < 0 ? 'W' : 'E'}`;
};
export const string2coords = (coords: string): number[] | null => {
	const reLat = /\s*(\d{1,2})\s*°(?:\s*(\d{1,2}(?:[.,]\d+)*)\s*\'(?:\s*(\d{1,2}(?:[.,]\d+)*(?:[.,]\d+)*)\s*\")*)*\s*([nNsS])\s*/;
	const reLon = /\s*(\d{1,3})\s*°(?:\s*(\d{1,2}(?:[.,]\d+)*)\s*\'(?:\s*(\d{1,2}(?:[.,]\d+)*(?:[.,]\d+)*)\s*\")*)*\s*([eEwW])\s*/;
	const latArr = reLat.exec(coords);
	const lonArr = reLon.exec(coords);
	if (!latArr || !lonArr) return null;
	for (let i = 1; i < 4; i++) {
		if (!latArr[i]) latArr[i] = '0';
		if (!lonArr[i]) lonArr[i] = '0';
	}
	return [
		degMinSec2deg(
			latArr.slice(1, 4).map(n => parseFloat(n.replace(/,/, '.')))
		) * (/[sS]/.test(latArr[4]) ? -1 : 1),
		degMinSec2deg(
			lonArr.slice(1, 4).map(n => parseFloat(n.replace(/,/, '.')))
		) * (/[wW]/.test(lonArr[4]) ? -1 : 1),
	];
};
export const point2coords = (p: Point, m: string, h: string): string => {
	return (
		coords2string([p.latitude, p.longitude]) +
		(p.altitude ? `, ${h} ${p.altitude} ${m}` : '')
	);
}
export const makeChildren = (plain: Record<string, Folder>): Record<string, Folder> => {
	if (!isPlainTreeCorrect(plain)) return {};
	const copy = JSON.parse(JSON.stringify(plain));
	for (const id in copy) {
		const parent = copy[copy[id].parent];
		if (parent) {
			if (!Object.hasOwn(parent, 'children')) parent['children'] = {};
			parent.children[id] = copy[id];
		}
		copy[id].builded = true;
	}
	return copy;
};
export const treeToPlain = (
	tree: Record<string, any>,
	childrenKey: string,
	plain: Array<Record<string, any>>
): Array<Record<string, any>> => {
	if (tree[childrenKey] && Object.keys(tree[childrenKey]).length > 0) {
		let plained;
		for (const obj of Object.values(tree[childrenKey])) {
			plained = JSON.parse(JSON.stringify(obj));
			delete plained[childrenKey];
			plain[plained.id] = plained;
			(resultForRecursive as Array<Record<string, any>>) =
				treeToPlain(obj, childrenKey, plain);
		}
	}
	return (resultForRecursive as Array<Record<string, any>>);
};
