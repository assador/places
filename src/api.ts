import axios from 'axios';
import { useMainStore } from '@/stores/main';

const api = axios.create({
	baseURL: '/backend/',
	timeout: 10000,
});
const getStore = () => useMainStore();

api.interceptors.request.use(config => {
	if (!config.silent) getStore().setBusy(true);
	return config;
}, error => {
	if (!error.config?.silent) getStore().setBusy(false);
	return Promise.reject(error);
});

api.interceptors.response.use(
	response => {
		if (!response.config.silent) getStore().setBusy(false);
		return response;
	},
	error => {
		if (!error.config?.silent) getStore().setBusy(false);
		return Promise.reject(error);
	}
);
export default api;
