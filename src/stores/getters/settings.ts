import { computed } from 'vue';
import { StoreMainStateRefs } from '@/stores/types';
import { Folder } from '@/types';
import { Setting } from '@/types/settings';

export function useGettersSettings(
	state: StoreMainStateRefs,
) {
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
		getSettingsGroups,
		getSettingsUser,
		getSettings,
	};
}
