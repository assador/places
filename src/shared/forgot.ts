import Vue from 'vue'
import axios from 'axios'
import { constants } from './constants'
export const forgot = Vue.observable({
	message: '',
});
export const forgotRoutine = (data) => new Promise((resolve, reject) => {
	axios.post('/backend/forgot.php', data)
		.then(response => {
			switch (response.data) {
			case 0 :
				forgot.message = 'При отправке письма произошла ошибка. Свяжитесь с <a href="mailto:' + constants.from + '">техподдержкой</a>.';
				break;
			case 1 :
				forgot.message = 'Пользователь с таким e-mail в сервисе не зарегистрирован.';
				break;
			default :
				forgot.message = 'На указанный вами e-mail отправлено письмо с вашими логином и новым паролем. При желении вы сможете изменить их в личном кабинете после авторизации.';
			}
			resolve(response);
		})
		.catch(error => {
			reject(error);
		})
});
