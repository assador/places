import api from '@/api';

export const regRoutine = async (payload: Record<string, string>): Promise<void> => {
	await api.post('reg.php', payload);
};
