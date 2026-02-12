import { Folder } from '@/stores/types';

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
// TODO Refactor.
export const formFolderForImported = (
	voc: Record<string, any>,
	time: string,
	imported?: Folder,
): {
	imported: Folder,
	folderid: 'imported',
} => {
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
			id: 'imported',
			parent: null,
			context: 'places',
			builded: false,
			open: false,
			added: true,
			deleted: false,
			updated: false,
			name: voc.o.importedFolderName,
			description: voc.o.importedFolderDescription,
			srt: 99999,
			userid: sessionStorage.getItem('places-useruuid') as string,
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
				open: false,
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
				open: false,
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
				open: false,
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
export const validateField = (value: string, type: string): boolean => {
	const re: Record<string, RegExp> = {
		'integer'     : /^-?\d+$/,
		'integerm'    : /^\d+$/,
		'decimal'     : /^-?\d+(?:\.\d+)?$/,
		'decimalm'    : /^\d+(?:\.\d+)?$/,
		'latlong'     : /^-?(?:\d){1,3}(?:\.\d+)?$/,
		'login'       : /^.{1,24}$/,
		'password'    : /^.{0,255}$/,
		'name'        : /^.{0,100}$/,
		'longname'    : /^.{0,500}$/,
		'description' : /^.{0,2044}$/,
		'e-mail'      : /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
		'phone'    : /^[+\d]*$/,
	}
	if (typeof value !== 'string' || typeof re[type] === 'undefined') {throw 'Illegal function attributes';}
	return re[type].test(value);
};
export const makeFieldsValidatable = (voc, anyway?: boolean): void => {
	const fields: Record<string, string[]> = {
		'authLogin'                : ['login',       voc.i.hints.fvNotMore24],
		'forgotEmail'              : ['e-mail',      voc.i.hints.fvEmailExample],
		'regLogin'                 : ['login',       voc.i.hints.fvNotMore24],
		'accountLogin'             : ['login',       voc.i.hints.fvNotMore24],
		'authPassword'             : ['password',    voc.i.hints.fvNotMore255],
		'regPassword'              : ['password',    voc.i.hints.fvNotMore255],
		'regPasswordRepeat'        : ['password',    voc.i.hints.fvNotMore255],
		'accountPassword'          : ['password',    voc.i.hints.fvNotMore255],
		'accountNewPassword'       : ['password',    voc.i.hints.fvNotMore255],
		'accountNewPasswordRepeat' : ['password',    voc.i.hints.fvNotMore255],
		'regName'                  : ['name',        voc.i.hints.fvNotMore100],
		'accountName'              : ['name',        voc.i.hints.fvNotMore100],
		'folderName'               : ['longname',    voc.i.hints.fvNotMore500],
		'folderDescription'        : ['description', voc.i.hints.fvNotMore2044],
		'regPhone'                 : ['phone',       voc.i.hints.fvPhoneExample],
		'accountPhone'             : ['phone',       voc.i.hints.fvPhoneExample],
		'regEmail'                 : ['e-mail',      voc.i.hints.fvEmailExample],
		'accountEmail'             : ['e-mail',      voc.i.hints.fvEmailExample],
		'email'                    : ['e-mail',      voc.i.hints.fvEmailExample],
		'detailed-latitude'        : ['latlong',     voc.i.hints.fvLatLonExample],
		'detailed-longitude'       : ['latlong',     voc.i.hints.fvLatLonExample],
		'detailed-id'              : ['integerm',    voc.i.hints.fvIdExample],
		'detailed-srt'             : ['decimal',     voc.i.hints.fvSrtExample],
	}
	for (const id in fields) {
		const field = document.getElementById(id);
		if (field && (!field.classList.contains('value_validatable') || anyway)) {
			field.classList.add('value_validatable');
			field.title = fields[id][1];
			field.addEventListener('input', event => {
				if ((<HTMLInputElement>event.currentTarget).value !== '') {
					if (validateField((<HTMLInputElement>event.currentTarget).value, fields[id][0])) {
						(<HTMLElement>event.currentTarget).classList.remove('value_wrong');
						(<HTMLElement>event.currentTarget).classList.add('value_correct');
					} else {
						(<HTMLElement>event.currentTarget).classList.remove('value_correct');
						(<HTMLElement>event.currentTarget).classList.add('value_wrong');
					}
				}
			}, false);
		}
	}
};
