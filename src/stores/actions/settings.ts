import api from '@/api';
import { Folder } from '@/types';
import { Setting } from '@/types/settings';
import { isSetting } from '@/guards';
import { StoreMain, ActionsSettings } from '@/stores/types';
import { initFolderFactory } from '@/stores/actions/entity';

export function useActionsSettings(
	store: StoreMain,
): ActionsSettings {

	const resetSettings = (): void => {
		store.settings.value = {
			user: {},
			groups: {},
		};
	};
	const resetSettingsGroups = (): void => {
		store.settings.value.groups = {};
	};
	const resetUserSettings = (): void => {
		store.settings.value.user = {};
	};
	const changeSetting = (
		{ entity, change }: { entity: Setting; change: Partial<Setting>; }
	): void => {
		Object.assign(entity, change);
		entity.updated = true;
		store.savedSettings.value = false;
		store.backupState();
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
		resetSettingsGroups();
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
			resetSettingsGroups();
		}
	};
	const setUserSettings = async (): Promise<void> => {
		const uuid = localStorage.getItem('places-useruuid');
		if (!uuid) return;
		resetUserSettings();
		try {
			const { data } = await api.get('get_settings_user.php?id=' + uuid);
			if (data) {
				const settings = combUserSettings(data);
				Object.assign(store.settings.value.user, settings);
			}
		} catch (error) {
			console.error(error);
			store.setMessage(store.t.value.m.popup.cannotGetData);
			resetUserSettings();
		}
	};
	const saveUserSettings = async (): Promise<void> => {
	};

	return {
		resetSettings,
		resetSettingsGroups,
		resetUserSettings,
		changeSetting,
		setSettingsGroups,
		setUserSettings,
		saveUserSettings,
	};
};
