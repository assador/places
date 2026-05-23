import { reactive } from 'vue';
import api from '@/api';

export const login = reactive({
	message: '',
});
export const loginRoutine = async (
	user: { authLogin: string, authPassword: string },
	voc: Record<string, any>,
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
	} catch (error) {
		console.error(error);
		localStorage.clear();
		return false;
	}
};
