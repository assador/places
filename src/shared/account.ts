import { reactive } from 'vue';
import axios from 'axios';

export const acc = reactive({
	message: '',
});
export const accountSaveRoutine = (account: Record<string, string>, voc) => {
	if (account.accountNewPassword == undefined) account.accountNewPassword = '';
	axios.post('/backend/set_account.php', account)
		.then(response => {
			switch (response.data) {
				case 0 :
					acc.message = voc.m.paged.savingDataError;
					break;
				case 1 :
					acc.message = voc.m.paged.confirmDataLetterSent;
					break;
				case 2 :
					acc.message = voc.m.paged.taCannotBeChanged;
					break;
				case 3 :
					acc.message = voc.m.paged.loginTaken;
					break;
			}
		})
	;
};
export const accountDeletionRoutine = (
	userId: string,
	leavePlaces: string,
	leaveImages: string
) => {
	axios.post(
		'/backend/delete_account.php',
		{userId: userId, leavePlaces: leavePlaces, leaveImages: leaveImages}
	);
};
