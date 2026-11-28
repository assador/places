import { Folder, FolderContext } from '@/types';
import {
	Setting,
	SettingType,
	SettingsEnum,
	SettingsOption,
	SettingsVocRec,
	typeNumber,
} from '@/types/settings';
import {
	isFolder,
	isSetting,
	isSettingsEnum,
	isSettingsOption,
	isSettingsVocRec,
} from '@/guards';
import {
	routineGetSettingsEnums,
	routineGetSettingsOptions,
	routineGetSettingsGroups,
	routineGetSettingsUser,
	routineGetSettingsUsersVoc,
} from '@/services/settings';
import {
	ActionsSettings,
	ActionsSettingsAdmin,
	BaseUpsertParams,
	StoreAdmin,
	StoreMain,
} from '@/stores/types';
import { useMainStore } from '@/stores/main';
import { findInDictByMinMaxKey, nextStringedNumericKey } from '@/shared/common';

// SEC Factories

function _defaultFolder(id: string | null): Folder {
	return {
		type: 'folder',
		id,
		userid: null,
		parent: null,
		context: 'settingsvoc',
		srt: 10,
		common: false,
		open: false,
		enabled: true,
		show: true,
		added: false,
		deleted: false,
		updated: false,
	};
}
function _defaultSetting(
	id: string | null,
	val: SettingType,
): Setting {
	return {
		type: 'setting',
		id: id === null ? crypto.randomUUID() : id,
		val,
		added: false,
		deleted: false,
		updated: false,
	};
}
function _defaultSettingsVocRec(
	id: string | null,
	valtype: number,
	baseval: SettingType,
): SettingsVocRec {
	return {
		type: 'settingsvocrec',
		id: id === null ? crypto.randomUUID() : id,
		valtype,
		baseval,
		folderid: null,
		srt: 10,
		public: true,
		checked: false,
		added: false,
		deleted: false,
		updated: false,
	};
}

// SEC Creating Settings

export function initFolderFactory(getId: () => string | null) {
	return function createFolder(overrides?: Partial<Folder>): Folder {
		return {
			..._defaultFolder(getId()),
			...overrides,
		};
	};
};
export function initSettingFactory(
	getId: () => string,
	getVal: () => SettingType,
) {
	return function createSetting(overrides?: Partial<Setting>): Setting {
		return {
			..._defaultSetting(getId(), getVal()),
			...overrides,
		};
	};
};
export function initSettingsVocRecFactory(
	getId: () => string,
	getValType: () => number,
	getBaseVal: () => SettingType,
) {
	return function createSettingsVocRec(overrides?: Partial<SettingsVocRec>): SettingsVocRec {
		return {
			..._defaultSettingsVocRec(getId(), getValType(), getBaseVal()),
			...overrides,
		};
	};
};

// SEC Helpers

export function convertSettingValue (value: SettingType, type: number): SettingType {
	switch (type) {
		case 0:
			return null;
		case 1:
			if (typeof value === 'boolean') {
				return value;
			}
			if (typeof value === 'string') {
				if (value === 'true') return true;
				if (value === 'false') return false;
			}
			if (typeof value === 'number') {
				if (value === 0) return false;
				if (value === 1) return true;
			}
			return null;
		case 2:
			if (typeof value === 'number') {
				return Number.isFinite(value) ? value : null;
			}
			if (typeof value === 'string') {
				const number = Number(value.trim());
				return Number.isFinite(number) ? number : null;
			}
			if (typeof value === 'boolean') {
				return value ? 1 : 0;
			}
			return null;
		case 3:
			if (typeof value === 'string') {
				return value;
			}
			if (typeof value === 'number' || typeof value === 'boolean') {
				return String(value);
			}
			return null;
		default:
			return null;
	}
};

async function getSettingsEnums(): Promise<Record<string, SettingsEnum>> {
	const dbEnums = await routineGetSettingsEnums();
	const enums: Record<string, SettingsEnum> = {};
	for (const id in dbEnums) {
		if (!Object.hasOwn(dbEnums, id)) continue;
		const dbEnum = dbEnums[id];
		const name = dbEnum.name?.trim();
		const description = dbEnum.description?.trim();
		const enm: Partial<SettingsEnum> = {
			id,
			type: 'settingsenum',
			valtype: dbEnum.type,
			srt: dbEnum.srt,
			...(name && { name }),
			...(description && { description }),
			added: false,
			deleted: false,
			updated: false,
		};
		if (isSettingsEnum(enm)) enums[id] = enm;
	}
	return enums;
};
async function getSettingsOptions(): Promise<Record<string, SettingsOption>> {
	const dbOptions = await routineGetSettingsOptions();
	const options: Record<string, SettingsOption> = {};
	for (const id in dbOptions) {
		if (!Object.hasOwn(dbOptions, id)) continue;
		const dbOption = dbOptions[id];
		const opt: Partial<SettingsOption> = {
			id,
			type: 'settingsoption',
			val: dbOption.value,
			srt: dbOption.srt,
			enabled: dbOption.enabled,
			enumid: String(dbOption.enumid),
			...(dbOption.extra !== undefined && { extra: dbOption.extra }),
			added: false,
			deleted: false,
			updated: false,
		};
		if (isSettingsOption(opt)) options[id] = opt;
	}
	return options;
};
async function getSettingsGroups(context: FolderContext): Promise<Record<string, Folder>> {
	const createFolder = initFolderFactory(() => null);
	const dbGroups = await routineGetSettingsGroups();
	const groups: Record<string, Folder> = {};
	for (const id in dbGroups) {
		if (!Object.hasOwn(dbGroups, id)) continue;
		const dbGroup = dbGroups[id];
		const name = dbGroup.name?.trim();
		const description = dbGroup.description?.trim();
		const group: Partial<Folder> = {
			id,
			parent: dbGroup.parent === null ? null : String(dbGroup.parent),
			srt: dbGroup.srt,
			...(name && { name }),
			...(description && { description }),
		};
		const folder = createFolder({ ...group, context });
		if (isFolder(folder)) groups[id] = folder;
	}
	return groups;
};
async function getSettingsUsersVoc(): Promise<Record<string, SettingsVocRec>> {
	const dbVoc = await routineGetSettingsUsersVoc();
	const voc: Record<string, SettingsVocRec> = {};
	for (const id in dbVoc) {
		if (!Object.hasOwn(dbVoc, id)) continue;
		const dbVocRec = dbVoc[id];
		const name = dbVocRec.name?.trim();
		const description = dbVocRec.description?.trim();
		const rec: Partial<SettingsVocRec> = {
			id,
			type: 'settingsvocrec',
			valtype: dbVocRec.type,
			baseval: dbVocRec.baseval,
			srt: dbVocRec.srt,
			public: dbVocRec.public,
			folderid: dbVocRec.groupid === null ? null : String(dbVocRec.groupid),
			...(dbVocRec.enumid !== undefined && { enumid: String(dbVocRec.enumid) }),
			...(name && { name }),
			...(description && { description }),
			checked: false,
			added: false,
			deleted: false,
			updated: false,
		};
		if (isSettingsVocRec(rec)) voc[id] = rec;
	}
	return voc;
};
async function getSettingsUser(): Promise<Record<string, Setting>> {
	const dbSettings = await routineGetSettingsUser();
	const settings: Record<string, Setting> = {};
	for (const id in dbSettings) {
		if (!Object.hasOwn(dbSettings, id)) continue;
		const dbSetting = dbSettings[id];
		const setting: Partial<Setting> = {
			id,
			type: 'setting',
			val: dbSetting.value,
		};
		if (isSetting(setting)) settings[id] = setting;
	}
	return settings;
};

// SEC Stores

export function useActionsSettings(
	store: StoreMain,
): ActionsSettings {

	const createSetting = initSettingFactory(
		() => crypto.randomUUID(),
		() => 3,
	);

	const clearSettings = (): void => {
		store.settings.value = {
			enums: {},
			groups: {},
			options: {},
			usersvoc: {},
			user: {},
		};
	};
	const clearSettingsEnums = (): void => {
		store.settings.value.enums = {};
	};
	const clearSettingsGroups = (): void => {
		store.settings.value.groups = {};
	};
	const clearSettingsOptions = (): void => {
		store.settings.value.options = {};
	};
	const clearSettingsUsersVoc = (): void => {
		store.settings.value.usersvoc = {};
	};
	const clearSettingsUser = (): void => {
		store.settings.value.user = {};
	};
	const resetSettingsUser = (ids?: string[]): void => {
		if (!ids) ids = Object.keys(store.settings.value.user);
		for (const id of ids) {
			const setting = store.settings.value.user[id];
			if (!setting) continue;
			setting.deleted = true;
		}
	};
	const setSetting = (rec: SettingsVocRec, val: SettingType): void => {
		const value =
			typeNumber[typeof val] === rec.valtype
				? val
				: convertSettingValue(val, rec.valtype)
		;
		const setting = store.settings.value.user[rec.id];
		if (setting) {
			setting.val = value;
			setting.updated = true;
			setting.deleted = false;
		} else {
			store.settings.value.user[rec.id] = createSetting({
				id: rec.id,
				val: value,
				added: true,
			});
		}
		store.savedSettings.value = false;
	};

// SEC DB

	const setSettingsEnums = async (): Promise<void> => {
		clearSettingsEnums();
		try {
			const enums = await getSettingsEnums();
			Object.assign(store.settings.value.enums, enums);
		} catch (error) {
			store.setMessage(store.t.value.m.errors.other.cannotGetData);
			clearSettingsEnums();
			throw error;
		}
	};
	const setSettingsOptions = async (): Promise<void> => {
		clearSettingsOptions();
		try {
			const options = await getSettingsOptions();
			Object.assign(store.settings.value.options, options);
		} catch (error) {
			store.setMessage(store.t.value.m.errors.other.cannotGetData);
			clearSettingsOptions();
			throw error;
		}
	};
	const setSettingsGroups = async (): Promise<void> => {
		clearSettingsGroups();
		try {
			const groups = await getSettingsGroups('settings');
			Object.assign(store.settings.value.groups, groups);
		} catch (error) {
			store.setMessage(store.t.value.m.errors.other.cannotGetData);
			clearSettingsGroups();
			throw error;
		}
	};
	const setSettingsUsersVoc = async (): Promise<void> => {
		clearSettingsUsersVoc();
		try {
			const voc = await getSettingsUsersVoc();
			Object.assign(store.settings.value.usersvoc, voc);
		} catch (error) {
			store.setMessage(store.t.value.m.errors.other.cannotGetData);
			clearSettingsUsersVoc();
			throw error;
		}
	};
	const setSettingsUser = async (): Promise<void> => {
		const oldSettings = { ...store.settings.value.user };
		clearSettingsUser();
		try {
			const settings = await getSettingsUser();
			Object.assign(store.settings.value.user, settings);
			for (const id in oldSettings) {
				if (!Object.hasOwn(oldSettings, id)) continue;
				if (Object.hasOwn(store.settings.value.user, id)) continue;
				store.settings.value.user[id] = oldSettings[id];
			}
		} catch (error) {
			store.setMessage(store.t.value.m.errors.other.cannotGetData);
			clearSettingsUser();
			throw error;
		}
	};

	return {
		clearSettings,
		clearSettingsEnums,
		clearSettingsGroups,
		clearSettingsOptions,
		clearSettingsUsersVoc,
		clearSettingsUser,
		resetSettingsUser,
		setSetting,
		setSettingsEnums,
		setSettingsGroups,
		setSettingsOptions,
		setSettingsUsersVoc,
		setSettingsUser,
	};
};

export function useActionsSettingsAdmin(
	store: StoreAdmin,
): ActionsSettingsAdmin {

	const createFolder = initFolderFactory(
		() => nextStringedNumericKey(store.settings.value.groups),
	);
	const createSettingsVocRec = initSettingsVocRecFactory(
		() => nextStringedNumericKey(store.settings.value.usersvoc),
		() => 3,
		() => '',
	);

	const addValueToSettingEnum = ({ rec, idx, val, enb, ext }: {
		rec: SettingsVocRec,
		idx?: number | null,
		val?: Exclude<SettingType, null | boolean>,
		enb?: boolean,
		ext?: string,
	}): boolean => {
/*
		if (rec.valtype < 2) return false;
		if (val !== undefined && !isValidSettingValue(val, rec.valtype)) return false;
		if (typeof idx === 'number' && (!rec.enum || !rec.enum[idx])) return false;
		if (!rec.enum) rec.enum = [];
		const extra = ext?.trim();
		const srt =
			idx === undefined ? (rec.enum.length ? rec.enum[rec.enum.length - 1].srt + 10 : 10) :
			idx === null ? (rec.enum[0] ? rec.enum[0].srt / 2 : 10) :
			(
				rec.enum[idx + 1]
					? rec.enum[idx].srt + (rec.enum[idx + 1].srt - rec.enum[idx].srt) / 2
					: rec.enum[idx].srt + 10
			)
		;
		const obj: SettingEnum = {
			srt: srt,
			val: val === undefined
				? rec.valtype === 2 ? 0 : ''
				: val
			,
			enabled: enb ?? true,
			...(extra && { extra }),
		};
		if (idx === undefined) rec.enum.push(obj);
		else if (idx === null) rec.enum.splice(0, 0, obj);
		else rec.enum.splice(idx + 1, 0, obj);
		rec.updated = true;
*/
		return true;
	};
	const changeValueInSettingEnum = ({ rec, idx, val }: {
		rec: SettingsVocRec,
		idx: number,
		val: Exclude<SettingType, null | boolean>,
	}): boolean => {
/*
		if (!rec.enum || !rec.enum[idx] || !isValidSettingValue(val, rec.valtype)) return false;
		rec.enum[idx].val = val;
		rec.updated = true;
*/
		return true;
	};
	const changeEnabledInSettingEnum = ({ rec, idx, enb }: {
		rec: SettingsVocRec,
		idx: number,
		enb: boolean,
	}): boolean => {
/*
		if (!rec.enum || !rec.enum[idx]) return false;
		rec.enum[idx].enabled = enb;
		rec.updated = true;
*/
		return true;
	};
	const changeExtraInSettingEnum = ({ rec, idx, ext }: {
		rec: SettingsVocRec,
		idx: number,
		ext: string | null,
	}): boolean => {
/*
		if (!rec.enum || !rec.enum[idx]) return false;
		const extra = ext?.trim();
		if (extra) rec.enum[idx].extra = extra;
		else delete rec.enum[idx].extra;
		rec.updated = true;
*/
		return true;
	};
	const deleteValueFromSettingEnum = ({ rec, idx }: {
		rec: SettingsVocRec,
		idx: number,
	}): boolean => {
/*
		if (!rec.enum || !rec.enum[idx]) return false;
		rec.enum.splice(idx, 1);
		rec.updated = true;
*/
		return true;
	};
	const deleteInSettings = (objects: Record<string, Folder | SettingsVocRec>): void => {
		for (const id in objects) {
			if (!Object.hasOwn(objects, id)) continue;
			const obj = objects[id];
			if (obj.id === null) continue;
			const dict = obj.type === 'folder'
				? store.settings.value.groups
				: store.settings.value.usersvoc
			;
			if (obj.added) delete dict[obj.id];
			else obj.deleted = true;
		}
	};
	const restoreInSettings = (objects: Record<string, Folder | SettingsVocRec>): void => {
		for (const id in objects) {
			if (!Object.hasOwn(objects, id)) continue;
			const obj = objects[id];
			if (obj.id === null) continue;
			if (obj.deleted) obj.deleted = false;
		}
	};
	const changeSettingsEnum = (
		{ entity, change }:
		{ entity: SettingsEnum; change: Partial<SettingsEnum>; }
	): void => {
		const normalizedChange = { ...change };
		if (change.valtype !== undefined && change.valtype !== entity.valtype) {
			if (change.valtype < 2) {
				normalizedChange.valtype = entity.valtype;
			} else {
/*
				const enumSource = change.enum ?? entity.enum;
				if (enumSource) {
					const seen = new Set<Exclude<SettingType, null | boolean>>();
					normalizedChange.enum = enumSource.flatMap((option) => {
						const val = convertSettingValue(option.val, newType) as Exclude<
							SettingType, null | boolean
						>;
						if (seen.has(val)) return [];
						seen.add(val);
						return [{ ...option, val }];
					});
				}
*/
			}
		}
		Object.assign(entity, normalizedChange);
		entity.updated = true;
	};
	const changeSettingsVocRec = (
		{ entity, change }:
		{ entity: SettingsVocRec; change: Partial<SettingsVocRec>; }
	): void => {
		const normalizedChange = { ...change };
		if (change.enumid !== undefined && change.enumid !== entity.enumid) {
			normalizedChange.valtype = store.settings.value.enums[change.enumid]?.valtype ?? 0;
			normalizedChange.baseval = null;
		} else if (change.baseval !== undefined || change.valtype !== undefined) {
			const newType = change.valtype ?? entity.valtype;
			const newBaseval = change.baseval !== undefined
				? change.baseval
				: entity.baseval
			;
			normalizedChange.baseval = convertSettingValue(newBaseval, newType);
		}
		if (change.valtype !== undefined && change.valtype !== entity.valtype) {
			delete entity.enumid;
			delete normalizedChange.enumid;
		}
		Object.assign(entity, normalizedChange);
		entity.updated = true;
	};
	const clearSettings = (): void => {
		store.settings.value = {
			enums: {},
			groups: {},
			options: {},
			usersvoc: {},
		};
	};
	const clearSettingsEnums = (): void => {
		store.settings.value.enums = {};
	};
	const clearSettingsGroups = (): void => {
		store.settings.value.groups = {};
	};
	const clearSettingsOptions = (): void => {
		store.settings.value.options = {};
	};
	const clearSettingsUsersVoc = (): void => {
		store.settings.value.usersvoc = {};
	};
	const resetSettingsUsersVoc = async (): Promise<void> => {
		await setSettingsUsersVoc();
	};
	const setSettingsEnums = async (): Promise<void> => {
		clearSettingsEnums();
		try {
			const enums = await getSettingsEnums();
			Object.assign(store.settings.value.enums, enums);
		} catch (error) {
			const mainStore = useMainStore();
			mainStore.setMessage(mainStore.t.m.errors.other.cannotGetData);
			clearSettingsEnums();
			throw error;
		}
	};
	const setSettingsOptions = async (): Promise<void> => {
		clearSettingsOptions();
		try {
			const options = await getSettingsOptions();
			Object.assign(store.settings.value.options, options);
		} catch (error) {
			const mainStore = useMainStore();
			mainStore.setMessage(mainStore.t.m.errors.other.cannotGetData);
			clearSettingsOptions();
			throw error;
		}
	};
	const setSettingsGroups = async (): Promise<void> => {
		clearSettingsGroups();
		try {
			const groups = await getSettingsGroups('settingsvoc');
			Object.assign(store.settings.value.groups, groups);
		} catch (error) {
			const mainStore = useMainStore();
			mainStore.setMessage(mainStore.t.m.errors.other.cannotGetData);
			clearSettingsGroups();
			throw error;
		}
	};
	const setSettingsUsersVoc = async (): Promise<void> => {
		clearSettingsUsersVoc();
		try {
			const voc = await getSettingsUsersVoc();
			Object.assign(store.settings.value.usersvoc, voc);
		} catch (error) {
			const mainStore = useMainStore();
			mainStore.setMessage(mainStore.t.m.errors.other.cannotGetData);
			clearSettingsUsersVoc();
			throw error;
		}
	};

// SEC Upserting Entities

	const upsertFolder = (params: BaseUpsertParams<Folder> = {}): Folder | null => {
		const {
			object,
			props,
			where = store.settings.value.groups,
			mode = 'new',
			silent = false,
		} = params;

		let folder: Folder | null = null;
		const parentId = props?.parent || object?.parent || null;

		let srt = 10;
		if (typeof props?.srt === 'number') {
			srt = props.srt;
		} else {
			const max = findInDictByMinMaxKey(where, 'srt', f => f.parent === parentId).max?.val;
			if (typeof max !== 'number') srt = 10; else srt += 10;
		}

		switch (mode) {
			case 'move':
				if (!object) return null;
				Object.assign(object, { updated: true }, props);
				folder = object;
				break;
			case 'change':
				if (!object) return null;
				Object.assign(object, { updated: true, deleted: false }, props);
				folder = object;
				break;
			case 'new':
				folder = createFolder({
					...props,
					parent: parentId,
					srt: srt,
					added: true,
				});
				if (folder.id) where[folder.id] = folder;
				break;
		}
		if (!silent && folder) {
			store.savedSettings.value = false;
		}
		return folder;
	};
	const upsertSettingsVocRec = (
		params: BaseUpsertParams<SettingsVocRec> = {}
	): SettingsVocRec | null => {
		const {
			object,
			props,
			where = store.settings.value.usersvoc,
			mode = 'new',
			silent = false,
		} = params;

		let rec: SettingsVocRec | null = null;
		const folderId = props?.folderid || object?.folderid || null;

		let srt = 10;
		if (typeof props?.srt === 'number') {
			srt = props.srt;
		} else {
			const max = findInDictByMinMaxKey(where, 'srt', r => r.folderid === folderId).max?.val;
			if (typeof max !== 'number') srt = 10; else srt += 10;
		}

		switch (mode) {
			case 'move':
				if (!object) return null;
				Object.assign(object, { updated: true }, props);
				rec = object;
				break;
			case 'change':
				if (!object) return null;
				Object.assign(object, { updated: true, deleted: false }, props);
				rec = object;
				break;
			case 'new':
				rec = createSettingsVocRec({
					...props,
					folderid: folderId,
					srt: srt,
					added: true,
				});
				where[rec.id] = rec;
				break;
			case 'clone':
				if (!object) return null;
				rec = createSettingsVocRec({
					...object,
					...props,
					id: nextStringedNumericKey(store.settings.value.usersvoc),
					srt: srt,
					added: true,
				});
				where[rec.id] = rec;
				break;
		}
		if (!silent) {
			store.savedSettings.value = false;
		}
		return rec;
	};
	const upsertSettingsVocRecFollowing = (
		entity: SettingsVocRec | null | undefined,
		params: BaseUpsertParams<SettingsVocRec> = {},
	): SettingsVocRec | null => {
		if (!entity) {
			return upsertSettingsVocRec({ ...params, props: { ...params.props } });
		}
		const srts = store.getSrts(entity.id, 'settingvocrec');
		const callParams: BaseUpsertParams<SettingsVocRec> = {
			...params,
			props: {
				...params.props,
				folderid: entity.folderid,
				srt: srts ? srts.after : 10,
			}
		};
		return upsertSettingsVocRec(callParams);
	};

	return {
		addValueToSettingEnum,
		changeValueInSettingEnum,
		changeEnabledInSettingEnum,
		changeExtraInSettingEnum,
		deleteValueFromSettingEnum,
		changeSettingsEnum,
		changeSettingsVocRec,
		clearSettings,
		clearSettingsEnums,
		clearSettingsGroups,
		clearSettingsOptions,
		clearSettingsUsersVoc,
		deleteInSettings,
		restoreInSettings,
		resetSettingsUsersVoc,
		setSettingsEnums,
		setSettingsGroups,
		setSettingsOptions,
		setSettingsUsersVoc,
		upsertFolder,
		upsertSettingsVocRec,
		upsertSettingsVocRecFollowing,
	};
};
