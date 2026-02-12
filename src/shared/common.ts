export const childrenCount = (
	tree: Record<string, any>,
	childrenKey: string,
	result = 0
): number => {
	if (Array.isArray(tree[childrenKey])) {
		for (let i = 0; i < tree[childrenKey].length; i++) {
			result = childrenCount(
				tree[childrenKey][i], childrenKey, ++result
			);
		}
	}
	return result;
};
export const changeByKeyValue = (
	tree: Record<string, any>,
	childrenKey: string,
	key: string,
	value: unknown,
	what: string
): void => {
	if (tree[childrenKey] && Object.keys(tree[childrenKey]).length > 0) {
		for (const id in tree[childrenKey]) {
			switch (what) {
				case "delete" :
					if (tree[childrenKey][id][key] === value) {
						delete tree[childrenKey][id];
					} else {
						changeByKeyValue(
							tree[childrenKey][id],
							childrenKey,
							key,
							value,
							what
						);
					}
					break;
				case "change" :
					tree[childrenKey][id][key] = value;
					changeByKeyValue(
						tree[childrenKey][id],
						childrenKey,
						key,
						value,
						what
					);
					break;
			}
		}
	}
};
/**
 * Finds N extreme values ​​(minimums or maximums) in an array.
 * More efficient than deep sort for large arrays when only a few values ​​are needed.
 * * @param array - Original array of numbers
 * @param count - How many elements need to be found
 * @param order - If < 0, searches for maxima, if >= 0 (or undefined), searches for minima
 * @returns Array of found elements
 * * @example
 * numbersMinMax([10, 2, 5, 1, 9], 2); // [1, 2] (2 smallest)
 * numbersMinMax([10, 2, 5, 1, 9], 2, -1); // [10, 9] (2 largest)
 */
export const numbersMinMax = (
	array: number[], count: number, order?: number
): number[] => {
	const min = order < 0 ? true : false;
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
	return result.reverse();
}
/**
 * Distance in kilometers between points on a sphere with coordinates in degrees.
 */
export const distanceOnSphere = (
	lat1: number, lon1: number,
	lat2: number, lon2: number,
	radius: number
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
export const makeDropDowns = (parent: any): void => {
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
