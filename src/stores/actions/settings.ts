import api from '@/api';
import { Folder } from '@/types';
import { Setting, SettingType } from '@/types/settings';
import { isSetting } from '@/guards';
import { StoreMain, ActionsSettings } from '@/stores/types';
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
			store.settings.value.user[id].val = store.settings.value.user[id].baseval;
			store.settings.value.user[id].updated = true;
		}
	};
	const changeSetting = (
		{ entity, change }: { entity: Setting; change: Partial<Setting>; }
	): void => {
		Object.assign(entity, change);
		entity.updated = true;
		store.savedSettings.value = false;
	};
	const combUserSettings = (source: Record<string, Setting>): Record<string, Setting> => {
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
			const { data } = await api.get('get_settings_groups.php');
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
			console.error(error);
			store.setMessage(store.t.value.m.popup.cannotGetData);
			clearSettingsGroups();
		}
	};
	const setUserSettings = async (): Promise<void> => {
		const uuid = localStorage.getItem('places-useruuid');
		if (!uuid) return;
		clearUserSettings();
		try {
			const { data } = await api.get('get_settings_users.php?id=' + uuid);
			if (data) {
				const settings = combUserSettings(data);
				Object.assign(store.settings.value.user, settings);
			}
		} catch (error) {
			console.error(error);
			store.setMessage(store.t.value.m.popup.cannotGetData);
			clearUserSettings();
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
