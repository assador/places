import { computed } from 'vue';
import { StoreMainStateRefs } from '@/stores/types';
import { Folder } from '@/types';
import { Setting, SettingCollection } from '@/types/settings';

export function useGettersSettings(
	state: StoreMainStateRefs,
) {
	const collectModifiedSettingsUsers = <T extends Setting>(c: Record<string, T>): T[] => {
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
	const collectModifiedSettingsGroups = <T extends Folder>(c: Record<string, T>): T[] => {
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
	const getAllModifiedSettings = computed((): SettingCollection => {
		return {
			user: collectModifiedSettingsUsers(state.settings.value.user),
			groups: collectModifiedSettingsGroups(state.settings.value.groups),
		};
	});
	const getSettingsGroups = computed((): Record<string, Folder> => {
		return state.settings.value.groups;
	});
	const getSettingsUser = computed((): Record<string, Setting> => {
		return state.settings.value.user;
	});
	const getSettings = computed((): Record<string, Setting> => {
		return getSettingsUser.value;
	});

	return {
		collectModifiedSettingsUsers,
		collectModifiedSettingsGroups,
		getAllModifiedSettings,
		getSettingsGroups,
		getSettingsUser,
		getSettings,
	};
}
