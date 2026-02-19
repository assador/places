import { reactive } from 'vue';
import axios from 'axios';
import { emitter } from './bus';

export const login = reactive({
	message: '',
});
export const loginRoutine = async (
	user: { authLogin: string, authPassword: string },
	voc: Record<string, any>,
) => {
	try {
		const { data } = await axios.post('/backend/login.php', user);
		switch (data) {
			case 0 :
				localStorage.clear();
				login.message = voc.m.paged.authError;
				break;
			case 1 :
				localStorage.clear();
				login.message = voc.m.paged.wrongLoginPassword;
				break;
			default :
				if (typeof data === 'object') {
					localStorage.setItem('places-useruuid', data.id);
					localStorage.setItem('places-session', data.session);
					emitter.emit('logged');
				}
		}
	} catch (error) {
		console.error(error);
		localStorage.clear();
	}
};
export const logoutRoutine = async (
	ids: { userId: string, sessionId: string },
) => {
	try {
		await axios.post('/backend/logout.php', ids);
	} catch (error) {
		console.error(error);
		localStorage.clear();
	}
};
