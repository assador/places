import axios from 'axios';
import { constants } from '@/shared/constants';
import { Folder } from '@/store/types';

let resultForRecursive: unknown;

export const generateRandomString = (length = 32): string => {
	const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const numChars: number = chars.length;
	let string = '';
	let index = 0;
	for (let i = 0; i < length; i++) {
		index = Math.floor(Math.random() * numChars);
		string += chars.substring(index, index + 1);
	}
	return string;
};
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
		`${latDMS[0]}°${latDMS[1]}'${latDMS[2].toFixed(2)}"${lat < 0 ? 'S' : 'N'} ` +
		`${lonDMS[0]}°${lonDMS[1]}'${lonDMS[2].toFixed(2)}"${lon < 0 ? 'W' : 'E'}`
	);
};
export const string2coords = (coords: string): number[] | null => {
	const reLat = /\s*(\d{1,2})\s*°\s*(\d{1,2})\s*\'\s*(\d{1,2}(?:[.,]\d+){0,1})\s*\"\s*([nNsS])\s*/;
	const reLon = /\s*(\d{1,3})\s*°\s*(\d{1,2})\s*\'\s*(\d{1,2}(?:[.,]\d+){0,1})\s*\"\s*([eEwW])\s*/;
	const latArr = reLat.exec(coords);
	const lonArr = reLon.exec(coords);
	if (latArr === null || lonArr === null) return null;
	return [
		 degMinSec2deg(latArr.slice(1, 4).map(n => parseFloat(n.replace(/,/, '.')))) *
			(/[sS]/.test(latArr[4]) ? -1 : 1),
		 degMinSec2deg(lonArr.slice(1, 4).map(n => parseFloat(n.replace(/,/, '.')))) *
			(/[wW]/.test(lonArr[4]) ? -1 : 1),
	];
};
export const treeToLivePlain = (
	tree: Record<string, any>,
	childrenKey: string,
	plain: Record<string, any>
): void => {
	plain[tree.id] = tree;
	if (tree[childrenKey] && Object.keys(tree[childrenKey]).length) {
		for (const id in tree[childrenKey]) {
			treeToLivePlain(tree[childrenKey][id], childrenKey, plain);
		}
	}
};
export const plainToTree = (plain: Record<string, any>): Record<string, any> => {
	const tree = {};
	let ready = false;
	while (!ready && Object.keys(plain).length > 0) {
		for (const id1 in plain) {
			ready = true;
			if (!plain[id1].builded) {
				if (plain[id1].parent === 'root') {
					tree[id1] = plain[id1];
					plain[id1].builded = true;
					ready = false;
				} else {
					for (const id2 in plain) {
						if (id2 === plain[id1].parent) {
							if (!plain[id2].children) {
								plain[id2].children = {};
							}
							plain[id2].children[id1] = plain[id1];
							plain[id1].builded = true;
							ready = false;
							break;
						}

					}
				}
			}
		}
	}
	return tree as Record<string, any>;
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
export const findInTree = (
	tree: Record<string, any>,
	childrenKey: string,
	key: string,
	value: unknown
): Record<string, any> | null => {
	if (tree[key] === value) {
		return tree;
	}
	if (tree[childrenKey]) {
		for (const sub in tree[childrenKey]) {
			if (sub === value) {
				return tree[childrenKey][sub];
			}
			resultForRecursive = findInTree(
				tree[childrenKey][sub],
				childrenKey,
				key,
				value
			);
			if (resultForRecursive) {
				return resultForRecursive;
			}
		}
	}
	return null;
};
export const isParentInTree = (
	tree: Record<string, any>,
	childrenKey: string,
	parentId: string,
	childId: string,
	parent?: Record<string, any>
): boolean => {
	if (!parent) {
		parent = findInTree(tree, childrenKey, 'id', parentId) || tree;
	}
	if (parent![childrenKey] && parent![childrenKey][childId]) {
		return true;
	}
	for (const id in parent![childrenKey]) {
		if (isParentInTree(
			tree,
			childrenKey,
			parentId,
			childId,
			parent![childrenKey][id]
		)) {
			return true;
		}
	}
	return false;
};
export const formFoldersCheckedIds = (): string[] => {
	const foldersCheckedIds = [];
	if (document.getElementById('popup-export__tree')) {
		let check = false;
		for (const folder of
			document.getElementById('popup-export__tree')
				.getElementsByClassName('folder')
		) {
			check = true;
			for (const placeCheckbox of
				folder.getElementsByClassName('to-export-place-checkbox')
			) {
				if (!(placeCheckbox as HTMLInputElement).checked) {
					check = false;
					break;
				}
			}
			if (check) {
				foldersCheckedIds.push(
					folder.id.match(/^to-export-places-menu-folder-(.+)$/)[1]
				);
			}
		}
	}
	return foldersCheckedIds;
};
export const treeNewIds = (
	tree: Record<string, any>,
	childrenKey: string,
	parentKey: string,
	items: Array<Record<string, any>>,
	itemParentKey: string
): void => {
	const newId = tree.id === "root" ? null : generateRandomString(32);
	if (Array.isArray(items) && items.length > 0) {
		for (let i = 0; i < items.length; i++) {
			if (items[i][itemParentKey] === tree.id) {
				items[i].id = generateRandomString(32);
				items[i][itemParentKey] = newId;
			}
		}
	}
	tree.id = newId;
	if (Array.isArray(tree[childrenKey]) && tree[childrenKey].length > 0) {
		for (let i = 0; i < tree[childrenKey].length; i++) {
			tree[childrenKey][i][parentKey] = tree.id;
			treeNewIds(
				tree[childrenKey][i],
				childrenKey,
				parentKey,
				items,
				itemParentKey
			);
		}
	}
};
export const formFolderForImported = (voc, time: string, imported?: Folder): any => {
	/**
	 * Creation of a folder for the imported places
	 * in the folder tree branch for imported places.
	 * Returns a string with ID of the created folder.
	 * formFolderForImported(
	 *     <time string YYYY-MM-DDTHH:MM:SS>,
	 *     [<object of a root folder for imported places>]
	 * )
	 */
	if (!imported || !imported.id) {
		imported = {
			type: 'folder',
			builded: false,
			opened: false,
			added: true,
			deleted: false,
			updated: false,
			id: 'imported',
			parent: 'root',
			name: voc.o.importedFolderName,
			description: voc.o.importedFolderDescription,
			srt: 99999,
			userid: sessionStorage.getItem('places-userid') as string,
			geomarks: 1,
			children: {} as Record<string, Folder>,
		};
	}
	if (!time) {
		return {imported: imported, folderid: 'imported'};
	} else {
		const date = {
			y: time.slice(0, 4),
			m: time.slice(5, 7),
			d: time.slice(8, 10),
		};
		const folders = {};
		for (const id in imported.children) {
			if (imported.children[id].name === date.y) {
				folders['y' + date.y] = imported.children[id];
				break;
			}
		}
		if (!folders['y' + date.y]) {
			folders['y' + date.y] = {
				type: 'folder',
				builded: false,
				opened: false,
				geomarks: 1,
				added: true,
				deleted: false,
				updated: false,
				id: generateRandomString(32),
				parent: imported.id,
				name: date.y,
				description: '',
				srt: Number(date.y) || 0,
				children: {},
			};
			imported.children[folders['y' + date.y].id] = folders['y' + date.y];
		}
		for (const id in folders['y' + date.y].children) {
			if (folders['y' + date.y].children[id].name === date.m) {
				folders['m' + date.m] = folders['y' + date.y].children[id];
				break;
			}
		}
		if (!folders['m' + date.m]) {
			folders['m' + date.m] = {
				type: 'folder',
				builded: false,
				opened: false,
				geomarks: 1,
				added: true,
				deleted: false,
				updated: false,
				id: generateRandomString(32),
				parent: folders['y' + date.y].id,
				name: date.m,
				description: '',
				srt: Number(date.m) || 0,
				children: {},
			};
			folders['y' + date.y].children[folders['m' + date.m].id] = folders['m' + date.m];
		}
		for (const id in folders['m' + date.m].children) {
			if (folders['m' + date.m].children[id].name === date.d) {
				folders['d' + date.d] = folders['m' + date.m].children[id];
				break;
			}
		}
		if (!folders['d' + date.d]) {
			folders['d' + date.d] = {
				type: 'folder',
				builded: false,
				opened: false,
				geomarks: 1,
				added: true,
				deleted: false,
				updated: false,
				id: generateRandomString(32),
				parent: folders['m' + date.m].id,
				name: date.d,
				description: '',
				srt: Number(date.d) || 0,
				children: {},
			};
			folders['m' + date.m].children[folders['d' + date.d].id] = folders['d' + date.d];
		}
		return {imported: imported, folderid: folders['d' + date.d].id};
	}
};
export const sortObjectsByProximity = (array: Array<Record<string, any>>): void => {
	// Sort geomarks so as to build the shortest path through them.
	let
		indexNearest = -1,
		distCurrent,
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
export const getAbout = async (): Promise<void> => {
	return await axios.get('/about.html')
		.then(response => response.data)
		.catch(error => new Error(error))
	;
};
export const maxNumbers = (array: number[], count: number): number[] => {
	const result = array.slice(0, count).sort((a, b) => a - b);
	const insertNew = (el: number): number => {
		for (let idx = 0; idx < result.length; idx++) {
			if (result[idx] === el) return idx;
			if (result[idx] > el) {
				result.shift();
				result.splice(idx - 1, 0, el);
				return idx;
			}
			if (result[idx] < el && idx === result.length - 1) {
				result.shift();
				result.push(el);
				return idx;
			}
		}
		return -1;
	}
	for (let i = count; i < array.length; i++) {
		if (array[i] <= result[0]) continue;
		insertNew(array[i]);
	}
	return result;
}
