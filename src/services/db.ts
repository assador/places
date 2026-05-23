import api from '@/api';
import { useMainStore } from '@/stores/main';
import { EntityCollection } from '@/types';

export const saveEnities = async (payload: EntityCollection): Promise<void> => {
	const mainStore = useMainStore();
	if (!payload) payload = mainStore.getAllModifiedPackage;
	try {
		if (!mainStore.user.testaccount) {
			await api.post(
				`set_entities.php`,
				{
					data: payload,
					userid: localStorage.getItem('places-useruuid'),
					sessionid: localStorage.getItem('places-session'),
				},
				{ silent: true },
			);
		}
		mainStore.savedToDB(payload);
	} catch (error) {
		const errorMessage = error.response?.data?.message || error.message || error;
		mainStore.setMessage(`${mainStore.t.m.popup.cannotSendDataToDb}: ${errorMessage}`);
	}
};
export const saveHome = async (id: string): Promise<void> => {
	const mainStore = useMainStore();
	if (mainStore.user.testaccount) return;
	try {
		await api.post(
			'set_home.php',
			{ id: localStorage.getItem('places-useruuid'), data: id },
			{ silent: true },
		);
	} catch (error) {
		mainStore.setMessage(`${mainStore.t.m.popup.cannotSendDataToDb}: ${error}`);
	}
};
export const saveAll = async (): Promise<void> => {
	const mainStore = useMainStore();
	saveEnities(mainStore.getAllModifiedPackage);
	saveHome(mainStore.user.homeplace);
}
