import { reactive } from 'vue';
import axios from 'axios';

export const reg = reactive({
	message: '',
});
export const regRoutine = async (payload: Record<string, string>, voc) => {
	try {
		const { data } = await axios.post('/backend/reg.php', payload);
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
	} catch (error) {
		reg.message = voc.m.paged.regError;
	}
};
