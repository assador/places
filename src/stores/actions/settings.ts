import api from '@/api';
import { Folder } from '@/types';
import { Setting, SettingType, SettingsVocRec } from '@/types/settings';
import { isSetting, isSettingsVocRec } from '@/guards';
import {
	StoreMain,
	StoreAdmin,
	ActionsSettings,
	ActionsSettingsAdmin,
} from '@/stores/types';
import { initFolderFactory } from '@/stores/actions/entity';

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

export function useActionsSettings(
	store: StoreMain,
): ActionsSettings {

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
	const resetUserSettings = (ids?: string[]): void => {
		if (!ids) ids = Object.keys(store.settings.value.user);
		for (const id of ids) {
			const setting = store.settings.value.user[id];
			if (!setting) continue;
			setting.val = setting.baseval;
			setting.updated = true;
		}
	};
	const changeSetting = (
		{ entity, change }: { entity: Setting; change: Partial<Setting>; }
	): void => {
		Object.assign(entity, change);
		entity.updated = true;
		store.savedSettings.value = false;
	};
	const combUserSettings = (
		source: Record<string, Setting>
	): Record<string, Setting> => {
		const settings: Record<string, Setting> = {};
		for (const id in source) {
			if (!Object.hasOwn(source, id)) continue;
			const setting = source[id];
			setting.id = String(id);
			setting.type = 'setting';
			setting.added = false;
			setting.deleted = false;
			setting.updated = false;
			if (isSetting(setting)) settings[id] = setting;
		}
		return settings;
	};

// SEC DB

	const setSettingsGroups = async (): Promise<void> => {
		clearSettingsGroups();
		try {
			const data = await api.get('get_settings_groups.php');
			if (Array.isArray(data)) {
				const groups: Record<string, Folder> = {};
				const createFolder = initFolderFactory(() => store.user.value?.id ?? null);
				for (const groupData of data) {
					groupData.id = String(groupData.id);
					if (groupData.parent) groupData.parent = String(groupData.parent);
					groups[groupData.id] = createFolder({
						...groupData,
						context: 'settings',
					});
				}
				Object.assign(store.settings.value.groups, groups);
			}
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
		clearSettings,
		clearSettingsGroups,
		clearUserSettings,
		resetUserSettings,
		changeSetting,
		setSettingsGroups,
		setUserSettings,
	};
};

export function useActionsSettingsAdmin(
	store: StoreAdmin,
): ActionsSettingsAdmin {

	const clearSettings = (): void => {
		store.settings.value = {
			usersvoc: {},
			groups: {},
		};
	};
	const combUserSettingsVoc = (
		source: Record<string, SettingsVocRec>
	): Record<string, SettingsVocRec> => {
		const voc: Record<string, SettingsVocRec> = {};
		for (const id in source) {
			if (!Object.hasOwn(source, id)) continue;
			const rec = source[id];
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

	return {
		clearSettings,
		clearUserSettingsVoc,
		resetUserSettingsVoc,
		setUserSettingsVoc,
	};
};
