import axios from 'axios';
import { setBusy } from '@/services/common';

const api = axios.create({
	baseURL: '/backend/',
	timeout: 10000,
});

api.interceptors.request.use(config => {
	if (!config.silent) setBusy(true);
	return config;
}, error => {
	if (!error.config?.silent) setBusy(false);
	return Promise.reject(error);
});

api.interceptors.response.use(
	response => {
		if (!response.config.silent) setBusy(false);
		return response;
	},
	error => {
		if (!error.config?.silent) setBusy(false);
		return Promise.reject(error);
	}
);
export default api;
