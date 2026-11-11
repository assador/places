import axios, { type AxiosResponse } from 'axios';
import { setBusy } from '@/services/common';

interface ApiResponse {
	ok: boolean;
	data?: any;
	error?: string;
}

export class ApiError extends Error {
	public readonly status: number;
	public readonly error: string;

	constructor(status: number, error: string) {
		super(error);
		this.name = 'ApiError';
		this.status = status;
		this.error = error;
	}
	getStatus(): number {
		return this.status;
	}
	getError(): string {
		return this.error;
	}
}

const axiosApi = axios.create({
	baseURL: '/backend/',
	timeout: 10000,
});
axiosApi.interceptors.request.use(
	(config) => {
		if (!config.silent) setBusy(true);
		return config;
	},
	(error) => {
		if (!error.config?.silent) setBusy(false);
		return Promise.reject(error);
	},
);
axiosApi.interceptors.response.use(
	(response) => {
		if (!response.config.silent) setBusy(false);
		return response;
	},
	(error) => {
		if (!error.config?.silent) setBusy(false);
		return Promise.reject(error);
	},
);

const request = async (request: Promise<AxiosResponse<ApiResponse>>) => {
	try {
		const response = await request;
		if (response.data.ok) return response.data.data;
		throw new ApiError(
			response.status,
			response.data.error ?? 'api_error',
		);
	} catch (error) {
		if (error instanceof ApiError) throw error;
		if (axios.isAxiosError(error) && error.response) {
			const data = error.response.data as ApiResponse;
			throw new ApiError(
				error.response.status,
				data?.error ?? 'api_error',
			);
		}
		throw error;
	}
};
const api = {
	get: (url: string, config?: object) =>
		request(axiosApi.get(url, config))
	,
	post: (url: string, data?: unknown, config?: object) =>
		request(axiosApi.post(url, data, config))
	,
};
export default api;
