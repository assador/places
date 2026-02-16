import { reactive } from 'vue';
import axios from 'axios';
import { emitter } from './bus';

export const login = reactive({
	message: '',
});
export const loginRoutine = async (
	user: { authLogin: string, authPassword: string },
	voc: Record<string, any>
) => {
	try {
		const { data } = await axios.post('/backend/auth.php', user);
		switch (data) {
			case 0 :
				sessionStorage.clear();
				login.message = voc.m.paged.authError;
				break;
			case 1 :
				sessionStorage.clear();
				login.message = voc.m.paged.wrongLoginPassword;
				break;
			default :
				if (typeof data === 'object') {
					sessionStorage.setItem('places-useruuid', data.id);
					sessionStorage.setItem('places-session', data.session);
					emitter.emit('logged');
				}
		}
	} catch (error) {
		console.error(error);
		sessionStorage.clear();
	}
};
