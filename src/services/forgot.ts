import api from '@/api';

export const forgotRoutine = async (email: string): Promise<void> => {
	await api.post('forgot.php', { forgotEmail: email });
};
