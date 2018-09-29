import {bus} from "./bus.js"
import axios from "axios"
export const accountSaveRoutine = account => new Promise((resolve, reject) => {
	if(account.accountNewPassword == undefined) {account.accountNewPassword = "";}
	axios.post("/backend/set_account.php", account)
		.then(response => {
			switch(response.data) {
				case 0 :
					break;
				case 1 :
					response.message = 'При сохранении данных произошла ошибка. Свяжитесь с <a href="mailto:service@places.scrofa-tridens.ru">техподдержкой</a>.';
					break;
				case 2 :
					response.message = "Этот логин занят. Выберите другой.";
					break;
				default :
					response.message = "На указанный вами e-mail отправлено письмо с инструкциями для подтверждения изменения данных. Выполните их в течение суток.";
			}
			resolve(response);
		})
		.catch(error => {
			reject(error);
		})
});
export const accountDeletionRoutine = (userId, leavePlaces, leaveImages) => new Promise((resolve, reject) => {
	axios.post("/backend/delete_account.php", userId, leavePlaces, leaveImages)
		.then(response => {
			resolve(response);
		})
		.catch(error => {
			reject(error);
		})
});
