import Vue from 'vue';
import axios from 'axios';
import store from '@/store';

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
						acc.message = store.state.t.m.paged.savingDataError;
						break;
					case 1 :
						acc.message = store.state.t.m.paged.confirmDataLetterSent;
						break;
					case 2 :
						acc.message = store.state.t.m.paged.taCannotBeChanged;
						break;
					case 3 :
						acc.message = store.state.t.m.paged.loginTaken;
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
