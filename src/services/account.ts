import api from '@/api';
import { Account } from '@/types';

export const accountSaveRoutine = async (account: Account): Promise<void> => {
	await api.post('set_account.php', {
		account,
		userid: localStorage.getItem('places-useruuid'),
		sessionid: localStorage.getItem('places-session'),
	});
};
export const accountDeletionRoutine = async (
	id: string,
	leavePlaces: string,
	leaveImages: string,
): Promise<void> => {
	await api.post('delete_account.php', {
		id,
		leavePlaces,
		leaveImages,
		userid: localStorage.getItem('places-useruuid'),
		sessionid: localStorage.getItem('places-session'),
	});
};
