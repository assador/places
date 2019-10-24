import { constants } from "./constants.js"
import { bus } from "./bus.js"
import axios from "axios"
export const accountSaveRoutine = account => new Promise((resolve, reject) => {
	if(account.accountNewPassword == undefined) account.accountNewPassword = "";
	axios.post("/backend/set_account.php", account)
		.then(response => {
			switch(response.data) {
				case 0 :
					response.message = 'При сохранении данных произошла ошибка, свяжитесь с <a href="mailto:' + constants.from + '">техподдержкой</a>';
					break;
				case 1 :
					response.message = "На указанный вами e-mail отправлено письмо с инструкциями для подтверждения изменения данных, выполните их в течение суток";
					break;
				case 2 :
					response.message = "Вы авторизовались под тестовым аккаунтом, который изменить нельзя";
					break;
				case 3 :
					response.message = "Этот логин занят, выберите другой";
					break;
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
