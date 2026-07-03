import { reactive } from 'vue';
import api from '@/api';
import { Dictionary } from '@/types'

export const reg = reactive({
	message: '',
});
export const regRoutine = async (payload: Record<string, string>, voc: Dictionary) => {
	try {
		const { data } = await api.post('reg.php', payload);
		switch (data) {
			case 0 :
				reg.message = voc.m.paged.regError;
				break;
			case 1 :
				reg.message = voc.m.paged.loginTaken;
				break;
			default :
				reg.message = voc.m.paged.regLetterSent;
		}
	} catch {
		reg.message = voc.m.paged.regError;
	}
};
