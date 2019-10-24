import { constants } from "./constants.js"
import { bus } from "./bus.js"
import axios from "axios"
export const regRoutine = reg => new Promise((resolve, reject) => {
	axios.post("/backend/reg.php", reg)
		.then(response => {
			switch(response.data) {
				case 0 :
					response.message = 'При регистрации произошла ошибка. Свяжитесь с <a href="mailto:' + constants.from + '">техподдержкой</a>.';
					break;
				case 1 :
					response.message = "Этот логин занят. Выберите другой.";
					break;
				default :
					response.message = "На указанный вами e-mail отправлено письмо с инструкциями для подтверждения регистрации. Выполните их в течение суток.";
			}
			resolve(response);
		})
		.catch(error => {
			reject(error);
		})
});
