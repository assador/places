import { Ref } from 'vue';
import { constants } from '@/shared/constants';
import { isRecord } from '@/guards';

export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	if (typeof error === 'string') return error;
	return 'unknown error';
}
export function anyObjectValue<T>(obj: Record<string, T>): T | undefined {
	for (const key in obj) return obj[key];
	return undefined;
}
export const childrenCount = (
	tree: Record<string, unknown>,
	childrenKey: string,
): number => {
	let count = 0;
	const children = tree[childrenKey];
	if (Array.isArray(children)) {
		for (const child of children) {
			count += 1 + childrenCount(child, childrenKey);
		}
	}
	return count;
};

export const clamp = (val: number, min: number, max: number): number => {
	return Math.min(max, Math.max(min, val));
};
export const roundTo = (num: number, prc: number = constants.map.precision): number => {
	return Number(Math.round(Number(num + 'e+' + prc)) + 'e-' + prc);
};

/**
 * Finds N extreme values (minimums or maximums) in an array.
 * More efficient than deep sort for large arrays when only a few values are needed.
 * @param array - Original array of numbers
 * @param count - How many elements need to be found
 * @param order - If < 0, searches for maxima, if >= 0 (or undefined), searches for minima
 * @returns Array of found elements
 * @example
 * numbersMinMax([10, 2, 5, 1, 9], 2); // [1, 2] (2 smallest)
 * numbersMinMax([10, 2, 5, 1, 9], 2, -1); // [10, 9] (2 largest)
 */
export const numbersMinMax = (
	array: number[], count: number, order?: number
): number[] => {
	const min = !order || order < 0 ? true : false;
	const result = array.slice(0, count).sort((a, b) => (min ? b - a : a - b));
	const insertNew = (el: number): number => {
		for (let idx = 0; idx < result.length; idx++) {
			if (result[idx] === el) return idx;
			if (min
				? (result[idx] < el && idx === result.length - 1)
				: (result[idx] > el)
			) {
				result.shift();
				result.splice(idx - 1, 0, el);
				return idx;
			}
			if (min
				? (result[idx] > el)
				: (result[idx] < el && idx === result.length - 1)
			) {
				result.shift();
				result.push(el);
				return idx;
			}
		}
		return -1;
	}
	for (let i = count; i < array.length; i++) {
		if (min
			? (array[i] > result[0])
			: (array[i] <= result[0])
		) continue;
		insertNew(array[i]);
	}
	return result.toReversed();
}
/**
 * Searches the object dictionary for objects
 * with the minimum and maximum text or numeric values for a specified key.
 * If a validation callback is provided,
 * only objects that pass the check are considered.
 */
export const findInDictByMinMaxKey = (
	dict: Record<string, unknown>,
	key: string,
	check?: (o: Record<string, unknown>) => boolean,
): {
	min: { key: string; val: number | string } | null;
	max: { key: string; val: number | string } | null;
} => {
	let min: { key: string; val: number | string } | null = null;
	let max: { key: string; val: number | string } | null = null;
	let expectedType: 'number' | 'string' | null = null;

	const isLess = (a: number | string, b: number | string): boolean => {
		if (typeof a === 'number' && typeof b === 'number') return a < b;
		return (
			String(a).localeCompare(String(b), undefined, {
				numeric: true,
				sensitivity: 'base',
			}) < 0
		);
	};
	for (const k of Object.keys(dict)) {
		const current = dict[k];
		if (!isRecord(current)) continue;
		if (check && !check(current)) continue;

		const v = current[key];
		const currentType = typeof v;

		if (currentType !== 'number' && currentType !== 'string') continue;
		if (!expectedType) expectedType = currentType;
		if (currentType !== expectedType) continue;

		const val = v as number | string;
		if (!min || isLess(val, min.val)) {
			min = { key: k, val };
		}
		if (!max || isLess(max.val, val)) {
			max = { key: k, val };
		}
	}
	return { min, max };
};
/**
 * Distance in kilometers between points on a sphere with coordinates in degrees.
 */
export const distanceOnSphere = (
	lat1: number, lon1: number,
	lat2: number, lon2: number,
	radius: number = constants.earthRadius,
): number => {
	const a = Math.abs(90 - lat1) * Math.PI / 180;
	const b = Math.abs(90 - lat2) * Math.PI / 180;
	const c = Math.abs(lon1 - lon2) * Math.PI / 180;
	const ang = Math.acos(
		Math.cos(a) * Math.cos(b) + Math.sin(a) * Math.sin(b) * Math.cos(c)
	);
	const distance = radius * ang;
	return distance;
}
export const makeDropDowns = (parent: Ref<HTMLElement>): void => {
	const dropdowns = parent.value.querySelectorAll('.dropdown');
	for (const dropdown of dropdowns) {
		const header = dropdown.querySelectorAll('.dropdown__header')[0];
		if (!header) continue;
		if (
			!dropdown.classList.contains('dropdown_open') &&
			!dropdown.classList.contains('dropdown_closed')
		) {
			dropdown.classList.add('dropdown_open');
		}
		header.addEventListener('click', () => {
			dropdown.classList.toggle('dropdown_open');
			dropdown.classList.toggle('dropdown_closed');
		}, false);
	}
}
export const getPointToSegmentDistance = (p: number[], a: number[], b: number[]) => {
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
	let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
	t = Math.max(0, Math.min(1, t));
	const projection = [a[0] + t * dx, a[1] + t * dy];
	return Math.hypot(p[0] - projection[0], p[1] - projection[1]);
};
export const calculatePopupPosition = (e: PointerEvent) => {
	const { clientWidth: width, clientHeight: height } = document.documentElement;
	const { clientX: x, clientY: y, pointerType } = e;
	const offset = pointerType === 'touch' ? 10 : 5;
	const isLeft = x < width / 2;
	const isUp = y < height / 2;
	return {
		top: isUp ? `${y + offset}px` : 'auto',
		left: isLeft ? `${x + offset}px` : 'auto',
		bottom: isUp ? 'auto' : `${height - y + offset}px`,
		right: isLeft ? 'auto' : `${width - x + offset}px`,
	};
};
export const anyInDict = (dict: Record<string, unknown>): unknown | undefined => {
	for (const key in dict) {
		if (Object.hasOwn(dict, key)) return dict[key];
	}
	return undefined;
};
export const anyInDictWhere = (
	dict: Record<string, unknown>,
	check?: (o: unknown) => boolean,
): unknown | undefined => {
	if (check === undefined) {
		return anyInDict(dict);
	} else {
		for (const key in dict) {
			if (Object.hasOwn(dict, key) && check(dict[key])) {
				return dict[key];
			}
		}
	}
	return undefined;
};
