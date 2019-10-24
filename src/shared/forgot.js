import { constants } from "./constants.js"
import { bus } from "./bus.js"
import axios from "axios"
export const forgotRoutine = forgot => new Promise((resolve, reject) => {
	axios.post("/backend/forgot.php", forgot)
		.then(response => {
			switch(response.data) {
				case 0 :
					response.message = 'При отправке письма произошла ошибка. Свяжитесь с <a href="mailto:' + constants.from + '">техподдержкой</a>.';
					break;
				case 1 :
					response.message = "Пользователь с таким e-mail в сервисе не зарегистрирован.";
					break;
				default :
					response.message = "На указанный вами e-mail отправлено письмо с вашими логином и новым паролем. При желении вы сможете изменить их в личном кабинете после авторизации.";
			}
			resolve(response);
		})
		.catch(error => {
			reject(error);
		})
});
