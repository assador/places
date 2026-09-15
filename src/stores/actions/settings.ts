// import api from '@/api';
import { StoreMain, ActionsSettings } from '@/stores/types';
import { SettingsContext, SettingType } from '@/types/settings';

export function useActionsSettings(
	store: StoreMain,
): ActionsSettings {

	const changeSetting = (
		{ id, value, context = 'user' }:
		{ id: number, value: SettingType, context?: SettingsContext }
	): void => {
		store.settings.value[context][id] = value;
	};
	const saveSettings = (): void => {
	};

	return {
		changeSetting,
		saveSettings,
	};
};
