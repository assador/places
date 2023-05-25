import { reactive } from 'vue';
import axios from 'axios';
import { emitter } from './bus';
import store from '@/store';

export const login = reactive({
	message: '',
});
export const loginRoutine = (user: {authLogin: string, authPassword: string}) => {
	axios.post('/backend/auth.php', user)
		.then(response => {
			switch (response.data) {
				case 0 :
					sessionStorage.removeItem('places-userid');
					sessionStorage.removeItem('places-session');
					login.message = store.state.t.m.paged.wrongLoginPassword;
					break;
				default :
					if (typeof response.data === 'object') {
						sessionStorage.setItem('places-userid', response.data.id);
						sessionStorage.setItem('places-session', response.data.session);
						emitter.emit('logged');
					}
			}
		})
		.catch(e => {
			console.error(e);
			sessionStorage.removeItem('places-userid');
			sessionStorage.removeItem('places-session');
		})
	;
};
