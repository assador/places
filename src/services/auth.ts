import { confirm } from '@/services/confirm';
import { logoutRoutine } from '@/shared/auth';
import { useMainStore } from '@/stores/main';

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
export const logout = async (): Promise<void> => {
	const mainStore = useMainStore();
	const getOut = async () => {
		mainStore.setBusy(true);
		const userId = localStorage.getItem('places-useruuid');
		const sessionId = localStorage.getItem('places-session');
		mainStore.unload();
		await logoutRoutine({ userId: userId, sessionId: sessionId });
	};
	if (mainStore.saved || mainStore.user.testaccount) {
		getOut();
	} else {
		confirm.open(getOut, [], mainStore.t.i.text.notSaved);
	}
};
