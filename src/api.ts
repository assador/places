import axios from 'axios';
import { emitter } from '@/shared/bus';

const api = axios.create({
	baseURL: '/backend/',
	timeout: 10000,
});

api.interceptors.request.use(config => {
	if (!config.silent) emitter.emit('busy', true);
	return config;
}, error => {
	if (!error.config?.silent) emitter.emit('busy', false);
	return Promise.reject(error);
});

api.interceptors.response.use(
	response => {
		if (!response.config.silent) emitter.emit('busy', false);
		return response;
	},
	error => {
		if (!error.config?.silent) emitter.emit('busy', false);
		return Promise.reject(error);
	}
);
export default api;
