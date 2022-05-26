import store from '@/store';
import { State, Waypoint, Place, Folder } from '../store/types';

let resultForRecursive: unknown;
export const commonFunctions = {
	generateRandomString(length = 32): string {
		const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		const numChars: number = chars.length;
		let string = '';
		for (let i = 0; i < length; i++) {
			string += chars.substr(Math.floor(Math.random() * numChars), 1);
		}
		return string;
	},
	sortObjects(array: Record<string, any>[], field: string): Record<string, any>[] {
		const sorted = array.slice().sort(function(a, b) {
			if (a[field] > b[field]) {
				return 1;
			}
			if (a[field] < b[field]) {
				return -1;
			}
			return 0;
		});
		return sorted;
	},
	// Sort geomarks so as to build the shortest path through them.
	sortObjectsByProximity(array: Record<string, any>[]): void {
		let
			indexNearest = -1,
			distCurrent,
			distMin = 10,
			lastIndex = 0
		;
		while (array.length > lastIndex + 1) {
			for (let i = lastIndex + 1; i < array.length; i++) {
				const llt = Number(array[lastIndex].latitude) * Math.PI / 180;
				const lln = Number(array[lastIndex].longitude) * Math.PI / 180;
				const clt = Number(array[i].latitude) * Math.PI / 180;
				const cln = Number(array[i].longitude) * Math.PI / 180;
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
	},
	childrenCount(tree: Record<string, any>, childrenKey: string, result = 0): number {
		if (Array.isArray(tree[childrenKey])) {
			for (let i = 0; i < tree[childrenKey].length; i++) {
				result = this.childrenCount(tree[childrenKey][i], childrenKey, ++result);
			}
		}
		return result;
	},
	findInTree(tree: Folder, childrenKey: string, key: string, value: unknown): any {
		if (tree[key] === value) {
			return tree;
		}
		if (tree[childrenKey]) {
			for (const sub in tree[childrenKey]) {
				if (sub === value) {
					return tree[childrenKey][sub];
				}
				resultForRecursive = this.findInTree(tree[childrenKey][sub], childrenKey, key, value);
				if (resultForRecursive) {
					return resultForRecursive;
				}
			}
		}
		return null;
	},
	changeByKeyValue(tree: Record<string, any>, childrenKey: string, key: string, value: unknown, what: string): void {
		if (tree[childrenKey] && Object.keys(tree[childrenKey]).length > 0) {
			for (const id in tree[childrenKey]) {
				switch (what) {
					case "delete" :
						if (tree[childrenKey][id][key] === value) {
							delete tree[childrenKey][id];
						} else {
							this.changeByKeyValue(
								tree[childrenKey][id], childrenKey, key, value, what
							);
						}
						break;
					case "change" :
						tree[childrenKey][id][key] = value;
						this.changeByKeyValue(
							tree[childrenKey][id], childrenKey, key, value, what
						);
						break;
				}
			}
		}
	},
	treeToPlain(
		tree: Record<string, any>,
		childrenKey: string,
		plain: Record<string, any>
	): Record<string, any> {
		if (tree[childrenKey] && Object.keys(tree[childrenKey]).length > 0) {
			let plained;
			for (const obj of Object.values(tree[childrenKey])) {
				plained = JSON.parse(JSON.stringify(obj));
				delete plained[childrenKey];
				plain[plained.id] = plained;
				(resultForRecursive as Record<string, any>) =
					this.treeToPlain(obj, childrenKey, plain);
			}
		}
		return (resultForRecursive as Record<string, any>);
	},
	treeToLivePlain(tree: Record<string, any>, childrenKey: string, plain: Record<string, any>): void {
		plain[tree.id] = tree;
		if (tree[childrenKey] && Object.keys(tree[childrenKey]).length) {
			for (const id in tree[childrenKey]) {
				this.treeToLivePlain(tree[childrenKey][id], childrenKey, plain);
			}
		}
	},
	treeNewIds(tree: Record<string, any>, childrenKey: string, parentKey: string, items: Record<string, any>[], itemParentKey: string): void {
		const newId = tree.id === "root" ? null : this.generateRandomString(32);
		if (Array.isArray(items) && items.length > 0) {
			for (let i = 0; i < items.length; i++) {
				if (items[i][itemParentKey] === tree.id) {
					items[i].id = this.generateRandomString(32);
					items[i][itemParentKey] = newId;
				}
			}
		}
		tree.id = newId;
		if (Array.isArray(tree[childrenKey]) && tree[childrenKey].length > 0) {
			for (let i = 0; i < tree[childrenKey].length; i++) {
				tree[childrenKey][i][parentKey] = tree.id;
				this.treeNewIds(
					tree[childrenKey][i],
					childrenKey,
					parentKey,
					items,
					itemParentKey
				);
			}
		}
	},
	isParentInTree(tree: Record<string, any>, childrenKey: string, parentId: string, childId: string, parent?: Record<string, any>): boolean {
		if (!parent) {
			parent = this.findInTree(tree, childrenKey, 'id', parentId) || tree;
		}
		if (parent![childrenKey] && parent![childrenKey][childId]) {
			return true;
		}
		for (const id in parent![childrenKey]) {
			if (this.isParentInTree(tree, childrenKey, parentId, childId, parent![childrenKey][id])) {
				return true;
			}
		}
		return false;
	},
	plainToTree(plain: Record<string, Folder>): Folder {
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
		return tree as Folder;
	},
	/**
	 * Creation of a folder for the imported places
	 * in the folder tree branch for imported places.
	 * Returns a string with ID of the created folder.
	 * formFolderForImported(
	 *     <time string YYYY-MM-DDTHH:MM:SS>,
	 *     [<object of a root folder for imported places>]
	 * )
	 */
	formFolderForImported(time: string, imported?: Folder): any {
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
				name: store.state.t.o.importedFolderName,
				description: store.state.t.o.importedFolderDescription,
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
					id: this.generateRandomString(32),
					parent: imported.id,
					name: date.y,
					description: '',
					srt: date.y,
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
					id: this.generateRandomString(32),
					parent: folders['y' + date.y].id,
					name: date.m,
					description: '',
					srt: date.m,
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
					id: this.generateRandomString(32),
					parent: folders['m' + date.m].id,
					name: date.d,
					description: '',
					srt: date.d,
					children: {},
				};
				folders['m' + date.m].children[folders['d' + date.d].id] = folders['d' + date.d];
			}
			return {imported: imported, folderid: folders['d' + date.d].id};
		}
	},
}
