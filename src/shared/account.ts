import Vue from 'vue';
import axios from 'axios';
export const acc = Vue.observable({
	message: '',
});
export const accountSaveRoutine: (account: Record<string, string>) => void =
	(account: Record<string, string>) => {
		if (account.accountNewPassword == undefined) account.accountNewPassword = '';
		axios.post('/backend/set_account.php', account)
			.then(response => {
				switch (response.data) {
					case 0 :
						acc.message = 'При сохранении данных произошла ошибка.';
						break;
					case 1 :
						acc.message = `
							На указанный вами e-mail отправлено письмо
							с инструкциями для подтверждения изменения данных,
							выполните их в течение суток.
						`;
						break;
					case 2 :
						acc.message = `
							Вы авторизовались под тестовым аккаунтом,
							который изменить нельзя.
						`;
						break;
					case 3 :
						acc.message = 'Этот логин занят, выберите другой.';
						break;
				}
			})
		;
	};
export const accountDeletionRoutine:
	(userId: string, leavePlaces: string, leaveImages: string) => void =
		(userId: string, leavePlaces: string, leaveImages: string) => {
			axios.post(
				'/backend/delete_account.php',
				{userId: userId, leavePlaces: leavePlaces, leaveImages: leaveImages}
			);
		};
