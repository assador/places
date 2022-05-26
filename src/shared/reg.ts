import Vue from 'vue';
import axios from 'axios';
import store from '@/store';

export const reg = Vue.observable({
	message: '',
});
export const regRoutine: (data: Record<string, string>) => void =
	(data: Record<string, string>) => {
		axios.post('/backend/reg.php', data)
			.then(response => {
				switch (response.data) {
					case 0 :
						reg.message = store.state.t.m.paged.regError;
						break;
					case 1 :
						reg.message = store.state.t.m.paged.loginTaken;
						break;
					default :
						reg.message = store.state.t.m.paged.regLetterSent;
				}
			})
		;
	};
