import api from '@/api';
import { Folder, FolderContext } from '@/types';
import { Setting, SettingEnum, SettingType, SettingsVocRec } from '@/types/settings';
import { isSetting, isSettingsVocRec, isValidSettingValue } from '@/guards';
import {
	ActionsSettings,
	ActionsSettingsAdmin,
	BaseUpsertParams,
	StoreAdmin,
	StoreMain,
} from '@/stores/types';
import { initFolderFactory } from '@/stores/actions/entity';
import { useMainStore } from '@/stores/main';
import { findInDictByMinMaxKey, nextStringedNumericKey } from '@/shared/common';

// SEC Factories

function _defaultSetting(
	id: string,
	valtype: number,
	val: SettingType,
	baseval: SettingType,
): Setting {
	return {
		type: 'setting',
		id: id,
		valtype: valtype,
		val: val,
		baseval: baseval,
		folderid: null,
		srt: 10,
		added: false,
		deleted: false,
		updated: false,
	};
}
function _defaultSettingsVocRec(
	id: string,
	valtype: number,
	baseval: SettingType,
): SettingsVocRec {
	return {
		type: 'settingsvocrec',
		id: id,
		valtype: valtype,
		baseval: baseval,
		folderid: null,
		srt: 10,
		added: false,
		deleted: false,
		updated: false,
	};
}

// SEC Creating Settings

export function initSettingFactory(
	getId: () => string,
	getValType: () => number,
	getVal: () => SettingType,
	getBaseVal: () => SettingType,
) {
	return function createSetting(overrides?: Partial<Setting>): Setting {
		return {
			..._defaultSetting(getId(), getValType(), getVal(), getBaseVal()),
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

async function getSettingsGroups(context: FolderContext): Promise<Record<string, Folder>> {
	const groups: Record<string, Folder> = {};
	const data = await api.get('get_settings_groups.php');
	if (Array.isArray(data)) {
		const createFolder = initFolderFactory(() => null);
		for (const groupData of data) {
			groupData.id = String(groupData.id);
			if (groupData.parent) groupData.parent = String(groupData.parent);
			groups[groupData.id] = createFolder({
				...groupData,
				context: context,
			});
		}
	}
	return groups;
};

// SEC Stores

export function useActionsSettings(
	store: StoreMain,
): ActionsSettings {

	const changeSetting = (
		{ entity, change }: { entity: Setting; change: Partial<Setting>; }
	): void => {
		Object.assign(entity, change);
		entity.updated = true;
		store.savedSettings.value = false;
	};
	const clearSettings = (): void => {
		store.settings.value = {
			user: {},
			groups: {},
		};
	};
	const clearSettingsGroups = (): void => {
		store.settings.value.groups = {};
	};
	const clearUserSettings = (): void => {
		store.settings.value.user = {};
	};
	const combUserSettings = (
		source: Record<string, Record<string, unknown>>
	): Record<string, Setting> => {
		const settings: Record<string, Setting> = {};
		for (const id in source) {
			if (!Object.hasOwn(source, id)) continue;
			const setting = source[id];
			setting.type = 'setting';
			setting.id = String(id);
			setting.added = false;
			setting.deleted = false;
			setting.updated = false;
			if (isSetting(setting)) settings[id] = setting;
		}
		return settings;
	};
	const resetUserSettings = (ids?: string[]): void => {
		if (!ids) ids = Object.keys(store.settings.value.user);
		for (const id of ids) {
			const setting = store.settings.value.user[id];
			if (!setting) continue;
			setting.val = setting.baseval;
			setting.updated = true;
		}
	};

// SEC DB

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
	const setUserSettings = async (): Promise<void> => {
		const userid = localStorage.getItem('places-useruuid');
		const sessionid = localStorage.getItem('places-session');
		if (!userid) return;
		clearUserSettings();
		try {
			const data = await api.post(
				`get_settings_users.php`,
				{ userid, sessionid },
			);
			if (data) {
				const settings = combUserSettings(data);
				Object.assign(store.settings.value.user, settings);
			}
		} catch (error) {
			store.setMessage(store.t.value.m.errors.other.cannotGetData);
			clearUserSettings();
			throw error;
		}
	};

	return {
		changeSetting,
		clearSettings,
		clearSettingsGroups,
		clearUserSettings,
		resetUserSettings,
		setSettingsGroups,
		setUserSettings,
	};
};

export function useActionsSettingsAdmin(
	store: StoreAdmin,
): ActionsSettingsAdmin {

	const createSettingsVocRec = initSettingsVocRecFactory(
		() => nextStringedNumericKey(store.settings.value.usersvoc),
		() => 3,
		() => '',
	);

	const addValueToSettingEnum = ({ rec, idx, val, ext }: {
		rec: SettingsVocRec,
		idx?: number | null,
		val?: Exclude<SettingType, null>,
		ext?: string,
	}): boolean => {
		if (rec.valtype === 0) return false;
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
				? rec.valtype === 1 ? false : rec.valtype === 2 ? 0 : ''
				: val
			,
			...(extra && { extra }),
		};
		if (idx === undefined) rec.enum.push(obj);
		else if (idx === null) rec.enum.splice(0, 0, obj);
		else rec.enum.splice(idx + 1, 0, obj);
		rec.updated = true;
		return true;
	};
	const changeValueInSettingEnum = ({ rec, idx, val }: {
		rec: SettingsVocRec,
		idx: number,
		val: Exclude<SettingType, null>,
	}): boolean => {
		if (!rec.enum || !rec.enum[idx] || !isValidSettingValue(val, rec.valtype)) return false;
		rec.enum[idx].val = val;
		rec.updated = true;
		return true;
	};
	const changeExtraInSettingEnum = ({ rec, idx, ext }: {
		rec: SettingsVocRec,
		idx: number,
		ext: string | null,
	}): boolean => {
		if (!rec.enum || !rec.enum[idx]) return false;
		const extra = ext?.trim();
		if (extra) rec.enum[idx].extra = extra;
		else delete rec.enum[idx].extra;
		rec.updated = true;
		return true;
	};
	const deleteValueFromSettingEnum = ({ rec, idx }: {
		rec: SettingsVocRec,
		idx: number,
	}): boolean => {
		if (!rec.enum || !rec.enum[idx]) return false;
		rec.enum.splice(idx, 1);
		rec.updated = true;
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
	const changeSettingsVocRec = (
		{ entity, change }:
		{ entity: SettingsVocRec; change: Partial<SettingsVocRec>; }
	): void => {
		const newType = change.valtype ?? entity.valtype;
		const newBaseval = change.baseval !== undefined
			? change.baseval
			: entity.baseval
		;
		const normalizedChange = { ...change };

		if (change.baseval !== undefined || change.valtype !== undefined) {
			normalizedChange.baseval = convertSettingValue(newBaseval, newType);
		}
		if (change.valtype !== undefined && change.valtype !== entity.valtype) {
			const enumSource = change.enum ?? entity.enum;
			if (newType === 0) {
				normalizedChange.enum = undefined;
			} else if (enumSource) {
				const seen = new Set<Exclude<SettingType, null>>();
				normalizedChange.enum = enumSource.flatMap((option) => {
					const val = convertSettingValue(option.val, newType);
					if (val === null || seen.has(val)) return [];
					seen.add(val);
					return [{ ...option, val }];
				});
			}
		}
		Object.assign(entity, normalizedChange);
		entity.updated = true;
	};
	const clearSettings = (): void => {
		store.settings.value = {
			usersvoc: {},
			groups: {},
		};
	};
	const clearSettingsGroups = (): void => {
		store.settings.value.groups = {};
	};
	const combUserSettingsVoc = (
		source: Record<string, Record<string, unknown>>
	): Record<string, SettingsVocRec> => {
		const voc: Record<string, SettingsVocRec> = {};
		for (const id in source) {
			if (!Object.hasOwn(source, id)) continue;
			const rec = source[id];
			rec.type = 'settingsvocrec';
			rec.id = String(id);
			rec.added = false;
			rec.deleted = false;
			rec.updated = false;
			if (isSettingsVocRec(rec)) voc[id] = rec;
		}
		return voc;
	};
	const clearUserSettingsVoc = (): void => {
		store.settings.value.usersvoc = {};
	};
	const resetUserSettingsVoc = async (): Promise<void> => {
		await setUserSettingsVoc();
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
	const setUserSettingsVoc = async (): Promise<void> => {
		const userid = localStorage.getItem('places-useruuid');
		if (!userid) return;
		clearUserSettingsVoc();
		try {
			const data = await api.get('get_settings_users_voc.php?id=' + userid);
			if (data) {
				const voc = combUserSettingsVoc(data);
				Object.assign(store.settings.value.usersvoc, voc);
			}
		} catch (error) {
			clearUserSettingsVoc();
			throw error;
		}
	};

// SEC Upserting Entities

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
		changeExtraInSettingEnum,
		deleteValueFromSettingEnum,
		changeSettingsVocRec,
		clearSettings,
		clearSettingsGroups,
		clearUserSettingsVoc,
		deleteInSettings,
		restoreInSettings,
		resetUserSettingsVoc,
		setSettingsGroups,
		setUserSettingsVoc,
		upsertSettingsVocRec,
		upsertSettingsVocRecFollowing,
	};
};
