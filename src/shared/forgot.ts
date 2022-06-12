import { reactive } from 'vue';
import axios from 'axios';
import store from '@/store';

export const forgot = reactive({
	message: '',
});
export const forgotRoutine: (data: Record<string, string>) => void =
	(data: Record<string, string>) => {
		axios.post('/backend/forgot.php', data)
			.then(response => {
				switch (response.data) {
					case 0 :
						forgot.message = store.state.t.m.paged.letterError;
						break;
					case 1 :
						forgot.message = store.state.t.m.paged.noUserWithEmail;
						break;
					default :
						forgot.message = store.state.t.m.paged.forgotLetterSent;
				}
			})
		;
	};
