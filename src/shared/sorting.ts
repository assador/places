import { isRecord } from '@/guards';

export const sortObjects = (
	array: Record<string, unknown>[],
	field: string,
): Record<string, unknown>[] => {
	return array.slice().sort((a, b) => {
		const valA = a[field];
		const valB = b[field];
		if (typeof valA === 'number' && typeof valB === 'number') {
			return valA - valB;
		}
		const strA = String(valA ?? '');
		const strB = String(valB ?? '');
		return strA.localeCompare(strB, undefined, {
			numeric: true,
			sensitivity: 'base',
		});
	});
};
export const moveInArray = (
	array: unknown[],
	from: number,
	to: number,
	before: boolean,
) => {
	const item = array.splice(from, 1)[0];
	let insertIndex = to;
	if (!before) insertIndex += 1;
	if (from < to) insertIndex -= 1;
	array.splice(insertIndex, 0, item);
};
export const moveInObject = (
	parent: Record<string, unknown>,
	changeId: string,
	targetId: string,
	key: string,
	before: boolean = false,
) => {
	const changeObj = parent[changeId];
	const targetObj = parent[targetId];
	if (
		!isRecord(changeObj) ||
		!isRecord(targetObj) ||
		typeof changeObj[key] !== 'number' ||
		typeof targetObj[key] !== 'number'
	) {
		return;
	}
	const targetVal = targetObj[key];
	let nearest = before ? -Infinity : Infinity;

	for (const k of Object.keys(parent)) {
		const current = parent[k];
		if (!isRecord(current)) continue;
		const val = current[key];
		if (typeof val !== 'number') continue;

		if (before) {
			if (val < targetVal && val > nearest) nearest = val;
		} else {
			if (val > targetVal && val < nearest) nearest = val;
		}
	}
	if (before) {
		changeObj[key] =
			nearest !== -Infinity
				? (targetVal - nearest) / 2 + nearest
				: targetVal / 2
		;
	} else {
		changeObj[key] =
			nearest !== Infinity
				? (nearest - targetVal) / 2 + targetVal
				: targetVal + 10
		;
	}
};
