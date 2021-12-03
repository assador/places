import Vue from 'vue';
import axios from 'axios';
export const reg = Vue.observable({
	message: '',
});
export const regRoutine: (data: Record<string, string>) => void =
	(data: Record<string, string>) => {
		axios.post('/backend/reg.php', data)
			.then(response => {
				switch (response.data) {
					case 0 :
						reg.message = 'При регистрации произошла ошибка.';
						break;
					case 1 :
						reg.message = 'Этот логин занят. Выберите другой.';
						break;
					default :
						reg.message = `
							На указанный вами e-mail отправлено письмо
							с инструкциями для подтверждения регистрации.
							Выполните их в течение суток.
						`;
				}
			})
		;
	};
