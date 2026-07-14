import api from '@/api';
import { useMainStore } from '@/stores/main';
import { Account } from '@/types';

export const accountSaveRoutine = async (account: Account) => {
	const mainStore = useMainStore();
	try {
		const { data } = await api.post('set_account.php', account);
		switch (data) {
			case 0 :
				mainStore.setMessage(mainStore.t.m.paged.savingDataError);
				break;
			case 1 :
				mainStore.setMessage(mainStore.t.m.paged.confirmDataLetterSent);
				break;
			case 2 :
				mainStore.setMessage(mainStore.t.m.paged.taCannotBeChanged);
				break;
			case 3 :
				mainStore.setMessage(mainStore.t.m.paged.loginTaken);
				break;
		}
	} catch (error) {
		console.error(error);
	}
};
export const accountDeletionRoutine = (
	userId: string,
	leavePlaces: string,
	leaveImages: string
) => {
	api.post(
		'delete_account.php',
		{ userId: userId, leavePlaces: leavePlaces, leaveImages: leaveImages },
	);
};
