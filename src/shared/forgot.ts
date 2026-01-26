import { reactive } from 'vue';
import axios from 'axios';

export const forgot = reactive({
	message: '',
});
export const forgotRoutine = async (payload: Record<string, string>, voc) => {
	try {
		const { data } = await axios.post('/backend/forgot.php', payload);
		switch (data) {
			case 1 :
				forgot.message = voc.m.paged.letterError;
				break;
			case 2 :
				forgot.message = voc.m.paged.letterErrorEmail;
				break;
			default :
				forgot.message = voc.m.paged.forgotLetterSent;
		}
	} catch (error) {
		forgot.message = voc.m.paged.letterError;
	}
};
