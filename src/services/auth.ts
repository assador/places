import { reactive } from 'vue';
import api from '@/api';
import { ping } from '@/services/ping';
import { buffer } from '@/services/buffer';
import { confirm } from '@/services/confirm';
import { useMainStore } from '@/stores/main';

export const login = reactive({
	message: '',
});
export const loginRoutine = async (
	user: { authLogin: string, authPassword: string },
): Promise<void> => {
	try {
		const data = await api.post('login.php', user);
		localStorage.setItem('places-useruuid', data.id);
		localStorage.setItem('places-session', data.session);
	} catch (error) {
		localStorage.removeItem('places-useruuid');
		localStorage.removeItem('places-session');
		throw error;
	}
};
export const logoutRoutine = async (
	ids: { userid: string | null, sessionid: string | null },
): Promise<void> => {
	await api.post('logout.php', ids);
};

export const logged = async (): Promise<void> => {
	const mainStore = useMainStore();
	await mainStore.setUser();
	await mainStore.setServerConfig();
	await mainStore.setUserSettings();
	await mainStore.setEntities();
	mainStore.ready = true;
	mainStore.openTreeToCurrent(mainStore.currentPlace);
	mainStore.openTreeToCurrent(mainStore.currentRoute);
	ping.init();
	buffer.init();
};
export const logout = async (): Promise<boolean> => {
	const mainStore = useMainStore();
	const getOut = async () => {
		try {
			mainStore.setBusy(true);
			await logoutRoutine({
				userid: localStorage.getItem('places-useruuid'),
				sessionid: localStorage.getItem('places-session'),
			});
			mainStore.unload();
		} finally {
			mainStore.setBusy(false);
		}
	};

// TODO This is temporary. Implement encrypted store in IndexedDB and authentication in offline mode.
	if (mainStore.offlineMode || !mainStore.online) {
		mainStore.setMessage(mainStore.t.i.text.offlineExit, 3);
		return false;
	}

	const confirmMessages: string[] = [];

	if (!mainStore.saved) {
		confirmMessages.push(mainStore.t.i.text.notSaved);
	}
	if (confirmMessages.length) {
		const confirmed = await confirm.open(confirmMessages.join('\n\n'));
		if (!confirmed) return false;
	}
	await getOut();
	ping.destroy();
	return true;
};
