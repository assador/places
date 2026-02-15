import { constants } from '@/shared/constants';

export const sortObjects = (
	array: Array<Record<string, any>>,
	field: string
): Array<Record<string, any>> => {
	const sorted = array.slice().sort((a, b) => {
		if (a[field] > b[field]) {
			return 1;
		}
		if (a[field] < b[field]) {
			return -1;
		}
		return 0;
	});
	return sorted;
};
export const moveInArray = (array: any[], from: number, to: number, before: boolean) => {
	const item = array.splice(from, 1)[0];
	let insertIndex = to;
	if (!before) insertIndex += 1;
	if (from < to) insertIndex -= 1;
	array.splice(insertIndex, 0, item);
};
export const moveInObject = (
	parent: Record<string, any>,
	change: Record<string, any>,
	target: Record<string, any>,
	key: string,
	before: boolean = false,
) => {
	let nearest = before ? -Infinity : Infinity;
	for (const obj of Object.values(parent)) {
		if (
			before && obj[key] < target[key] && obj[key] > nearest ||
			!before && obj[key] > target[key] && obj[key] < nearest
		) {
			nearest = obj[key];
		}
	}
	if (before) {
		if (nearest !== -Infinity) {
			change[key] = (target[key] - nearest) / 2 + nearest;
		} else {
			change[key] = target[key] / 2;
		}
	} else {
		if (nearest !== Infinity) {
			change[key] = (nearest - target[key]) / 2 + target[key];
		} else {
			change[key] = target[key] + 10;
		}
	}
};
export const sortObjectsByProximity = (array: Array<Record<string, any>>): void => {
	// Sort geomarks so as to build the shortest path through them.
	let
		indexNearest = -1,
		distCurrent: number,
		distMin = 10,
		lastIndex = 0
	;
	while (array.length > lastIndex + 1) {
		for (let i = lastIndex + 1; i < array.length; i++) {
			const llt = (
				Number(array[lastIndex].latitude) ||
				Number(constants.map.initial.latitude) ||
				null
			) * Math.PI / 180;
			const lln = (
				Number(array[lastIndex].longitude) ||
				Number(constants.map.initial.longitude) ||
				null
			) * Math.PI / 180;
			const clt = (
				Number(array[i].latitude) ||
				Number(constants.map.initial.latitude) ||
				null
			) * Math.PI / 180;
			const cln = (
				Number(array[i].longitude) ||
				Number(constants.map.initial.longitude) ||
				null
			) * Math.PI / 180;
			distCurrent =
				Math.acos(
					Math.sin(llt) * Math.sin(clt) +
					Math.cos(llt) * Math.cos(clt) * Math.cos(cln - lln)
				)
			;
			if (distCurrent < distMin) {
				distMin = distCurrent;
				indexNearest = i;
			}
		}
		distMin = 10;
		if (indexNearest !== -1) {
			array.splice(lastIndex++ + 1, 0, array.splice(indexNearest, 1)[0]);
		}
	}
};
