import Vue from 'vue'
import axios from 'axios'
import { bus } from './bus'
export const login = Vue.observable({
	message: '',
});
export const loginRoutine = (user: {login: string, password: string}) =>
	 new Promise((resolve, reject) => {
		axios.post('/backend/auth.php', user)
			.then(response => {
				switch (response.data) {
				case 0 :
					sessionStorage.removeItem('places-userid');
					sessionStorage.removeItem('places-session');
					login.message = 'Неверные логин или пароль';
					break;
				default :
					if (typeof response.data === 'object') {
						sessionStorage.setItem('places-session', response.data.session);
						sessionStorage.setItem('places-userid', response.data.id);
						bus.$emit('loggedChange', 'home');
					}
				}
				resolve(response);
			})
			.catch(error => {
				sessionStorage.removeItem('places-userid');
				sessionStorage.removeItem('places-session');
				reject(error);
			})
	});
