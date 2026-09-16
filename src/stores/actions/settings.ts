import api from '@/api';
import { StoreMain, ActionsSettings } from '@/stores/types';
import { Folder } from '@/types';
import { SettingKey, SettingType, SettingsContext } from '@/types/settings';
import { initFolderFactory } from '@/stores/actions/entity';

export function useActionsSettings(
	store: StoreMain,
): ActionsSettings {

	const resetSettings = (): void => {
		store.settings.value = {
			user: {
				[SettingKey.Lang]: 'ru',
				[SettingKey.ColorTheme]: 'brown',
			},
			vocs: { user: {} },
			groups: {},
		};
	};
	const resetSettingsGroups = (): void => {
		store.settings.value.groups = {};
	};
	const resetUserSettings = (): void => {
		store.settings.value.user = {
			[SettingKey.Lang]: 'ru',
			[SettingKey.ColorTheme]: 'brown',
		};
		store.settings.value.vocs.user = {};
	};
	const changeSetting = (
		{ id, value, context = 'user' }:
		{ id: number, value: SettingType, context?: SettingsContext }
	): void => {
		store.settings.value[context][id] = value;
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
				Object.assign(store.settings.value, data);
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
