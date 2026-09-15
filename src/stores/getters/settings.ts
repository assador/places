import { StoreMainStateRefs } from '@/stores/types';
import { SettingsContext, SettingsVocRec } from '@/types/settings';

export function useGettersSettings(
	state: StoreMainStateRefs,
) {
	const getSettingsVocRec = (
		{ id, context = 'user' }:
		{ id: number, context?: SettingsContext }
	): SettingsVocRec | undefined => {
		return state.settings.value.vocs[context][id];
	};

	return {
		getSettingsVocRec,
	};
}
