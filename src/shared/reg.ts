import Vue from 'vue'
import axios from 'axios'
import { constants } from './constants'
export const reg = Vue.observable({
	message: '',
});
export const regRoutine = (data) => new Promise((resolve, reject) => {
	axios.post('/backend/reg.php', data)
		.then(response => {
			switch (response.data) {
				case 0 :
					reg.message = 'При регистрации произошла ошибка. Свяжитесь с <a href="mailto:' + constants.from + '">техподдержкой</a>.';
					break;
				case 1 :
					reg.message = 'Этот логин занят. Выберите другой.';
					break;
				default :
					reg.message = 'На указанный вами e-mail отправлено письмо с инструкциями для подтверждения регистрации. Выполните их в течение суток.';
			}
			resolve(response);
		})
		.catch(error => {
			reject(error);
		})
});
