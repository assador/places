import { reactive } from 'vue';
import axios from 'axios';

export const forgot = reactive({
	message: '',
});
export const forgotRoutine = (data: Record<string, string>, voc) => {
	axios.post('/backend/forgot.php', data)
		.then(response => {
			switch (response.data) {
				case 1 :
					forgot.message = voc.m.paged.letterError;
					break;
				case 2 :
					forgot.message = voc.m.paged.letterErrorEmail;
					break;
				default :
					forgot.message = voc.m.paged.forgotLetterSent;
			}
		})
		.catch(() => forgot.message = voc.m.paged.letterError);
	;
};
