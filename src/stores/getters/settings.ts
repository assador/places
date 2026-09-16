import { computed } from 'vue';
import { StoreMainStateRefs } from '@/stores/types';
import { Setting, SettingsContext, SettingsVocRec } from '@/types/settings';

export function useGettersSettings(
	state: StoreMainStateRefs,
) {
	const getSettingsVocRec = (
		{ id, context = 'user' }:
		{ id: number, context?: SettingsContext }
	): SettingsVocRec | undefined => {
		return state.settings.value.vocs[context][id];
	};
	const getSettingsUser = computed((): Record<string, Setting> => {
		const settings: Record<string, Setting> = {};
		const vocs = state.settings.value.vocs.user;
		for (const id of Object.keys(vocs)) {
			settings[id] = {
				...vocs[id],
				id: id,
				type: 'setting',
				val: state.settings.value.user[id],
			}
		}
		return settings;
	});

	return {
		getSettingsVocRec,
		getSettingsUser,
	};
}
