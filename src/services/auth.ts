import { reactive } from 'vue';
import api from '@/api';
import { confirm } from '@/services/confirm';
import { useMainStore } from '@/stores/main';
import { Dictionary } from '@/types'

export const login = reactive({
	message: '',
});
export const loginRoutine = async (
	user: { authLogin: string, authPassword: string },
	voc: Dictionary,
): Promise<boolean> => {
	try {
		const { data } = await api.post('login.php', user);
		switch (data) {
			case 0 :
				localStorage.clear();
				login.message = voc.m.paged.authError;
				return false;
			case 1 :
				localStorage.clear();
				login.message = voc.m.paged.wrongLoginPassword;
				return false;
			default :
				if (typeof data === 'object') {
					localStorage.setItem('places-useruuid', data.id);
					localStorage.setItem('places-session', data.session);
					return true;
				}
		}
		return false;
	} catch (error) {
		console.error(error);
		localStorage.clear();
		return false;
	}
};
export const logoutRoutine = async (
	ids: { userId: string, sessionId: string },
) => {
	try {
		await api.post('logout.php', ids);
		return true;
	} catch (error) {
		console.error(error);
		localStorage.clear();
		return false;
	}
};

export const logged = async (): Promise<void> => {
	const mainStore = useMainStore();
	mainStore.setBusy(true);
	await mainStore.setUser();
	await mainStore.setServerConfig();
	await mainStore.setEntities();
	mainStore.ready = true;
	mainStore.openTreeToCurrent(mainStore.currentPlace);
	mainStore.openTreeToCurrent(mainStore.currentRoute);
};
export const logout = async (): Promise<boolean> => {
	const mainStore = useMainStore();
	const getOut = async () => {
		mainStore.setBusy(true);
		const userId = localStorage.getItem('places-useruuid');
		const sessionId = localStorage.getItem('places-session');
		mainStore.unload();
		await logoutRoutine({ userId: userId, sessionId: sessionId });
		mainStore.setBusy(false);
	};
	if (mainStore.saved || mainStore.user.testaccount) {
		await getOut();
		return true;
	}
	const confirmed = await confirm.open(mainStore.t.i.text.notSaved);
	if (confirmed) {
		await getOut();
		return true;
	}
	return false;
};
