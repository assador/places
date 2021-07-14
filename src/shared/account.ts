import Vue from 'vue'
import axios from 'axios'
import { bus } from './bus'
import { constants } from './constants'
export const acc = Vue.observable({
	message: '',
});
export const accountSaveRoutine = (account) => new Promise((resolve, reject) => {
	if(account.accountNewPassword == undefined) account.accountNewPassword = '';
	axios.post('/backend/set_account.php', account)
		.then(response => {
			switch(response.data) {
			case 0 :
				acc.message = 'При сохранении данных произошла ошибка, свяжитесь с <a href="mailto:' + constants.from + '">техподдержкой</a>';
				bus.$emit('loggedChange', 'home');
				break;
			case 1 :
				acc.message = 'На указанный вами e-mail отправлено письмо с инструкциями для подтверждения изменения данных, выполните их в течение суток';
				break;
			case 2 :
				acc.message = 'Вы авторизовались под тестовым аккаунтом, который изменить нельзя';
				break;
			case 3 :
				acc.message = 'Этот логин занят, выберите другой';
				break;
			}
			resolve(response);
		})
		.catch(error => {
			reject(error);
		})
});
export const accountDeletionRoutine = (userId, leavePlaces, leaveImages) =>
	new Promise((resolve, reject) => {
		axios.post(
			'/backend/delete_account.php',
			{userId: userId, leavePlaces: leavePlaces, leaveImages: leaveImages}
		).then(response => {
			resolve(response);
		}).catch(error => {
			reject(error);
		})
	});
