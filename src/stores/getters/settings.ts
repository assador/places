import { computed } from 'vue';
import { StoreMainStateRefs } from '@/stores/types';
import { Setting } from '@/types/settings';

export function useGettersSettings(
	state: StoreMainStateRefs,
) {
	const getSettingsUser = computed((): Record<string, Setting> => {
		return state.settings.value.user;
	});

	return {
		getSettingsUser,
	};
}
