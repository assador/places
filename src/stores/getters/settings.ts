import { computed } from 'vue';
import { StoreMainStateRefs, StoreAdminStateRefs } from '@/stores/types';
import { Folder } from '@/types';
import { Setting, SettingCollection, SettingsAdmin, SettingsMain, SettingsVocRec } from '@/types/settings';

function collectModifiedSettings<T extends Folder | Setting | SettingsVocRec>(c: Record<string, T>): T[] {
	const modified: T[] = [];
	for (const id in c) {
		if (!Object.hasOwn(c, id)) continue;
		if (
			(c[id].added || c[id].updated || c[id].deleted) &&
			!(c[id].added && c[id].deleted)
		) {
			modified.push(c[id]);
		}
	}
	return modified;
};

export function useGettersSettings(
	state: StoreMainStateRefs,
) {

	const getAllModifiedSettings = computed((): SettingCollection => {
		return {
			groups: collectModifiedSettings(state.settings.value.groups),
			user: collectModifiedSettings(state.settings.value.user),
		};
	});
	const getSettingsGroups = computed((): Record<string, Folder> => {
		return state.settings.value.groups;
	});
	const getSettingsUser = computed((): Record<string, Setting> => {
		return state.settings.value.user;
	});
	const getSettings = computed((): SettingsMain => {
		return {
			groups: getSettingsGroups.value,
			user: getSettingsUser.value,
		};
	});

	return {
		getAllModifiedSettings,
		getSettingsGroups,
		getSettingsUser,
		getSettings,
	};
};

export function useGettersSettingsAdmin(
	state: StoreAdminStateRefs,
) {

	const getAllModifiedSettings = computed((): SettingCollection => {
		return {
			groups: collectModifiedSettings(state.settings.value.groups),
			usersvoc: collectModifiedSettings(state.settings.value.usersvoc),
		};
	});
	const getSettingsGroups = computed((): Record<string, Folder> => {
		return state.settings.value.groups;
	});
	const getSettingsUsersVoc = computed((): Record<string, SettingsVocRec> => {
		return state.settings.value.usersvoc;
	});
	const getSettings = computed((): SettingsAdmin => {
		return {
			groups: getSettingsGroups.value,
			usersvoc: getSettingsUsersVoc.value,
		};
	});

	return {
		getAllModifiedSettings,
		getSettingsUsersVoc,
		getSettings,
	};
};
