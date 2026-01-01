import { reactive } from 'vue';
import axios from 'axios';
import { emitter } from './bus';

export const login = reactive({
	message: '',
});
export const loginRoutine = async (
	user: {authLogin: string, authPassword: string},
	voc: Record<string, any>
) => {
	axios.post('/backend/auth.php', user)
		.then(response => {
			switch (response.data) {
				case 0 :
					sessionStorage.clear();
					login.message = voc.m.paged.wrongLoginPassword;
					break;
				default :
					if (typeof response.data === 'object') {
						sessionStorage.setItem('places-useruuid', response.data.id);
						sessionStorage.setItem('places-session', response.data.session);
						emitter.emit('logged');
					}
			}
		})
		.catch(e => {
			console.error(e);
			sessionStorage.clear();
		})
	;
};
