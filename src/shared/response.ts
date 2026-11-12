import { ApiError } from '@/api';
import { Dictionary } from '@/types';
import { hasOwnStringKey } from '@/guards';
import { useMainStore } from '@/stores/main';

const RESPONSES = {
	insufficient_permissions : 'insufficientPermissions',
	internal_error           : 'internalError',
	invalid_credentials      : 'invalidCredentials',
	invalid_request          : 'invalidRequest',
	invalid_response         : 'invalidResponse',
	invalid_session          : 'invalidSession',
	invalid_token            : 'invalidToken',
	mail_error               : 'mailError',
	no_response              : 'noResponse',
	nothing_to_do            : 'nothingToDo',
	test_account             : 'testAccount',
	user_data_conflict       : 'userDataConflict',
	user_not_found           : 'userNotFound',
	wrong_account            : 'wrongAccount',
} as const;

type DictionaryKey = keyof Dictionary['m']['response'];

function hasResponseKey(key: string): key is keyof typeof RESPONSES {
	return hasOwnStringKey(RESPONSES, key);
}

function getDictSec (status: number): DictionaryKey | undefined {
	if (status >= 100 && status < 200) return 'info';
	else if (status >= 200 && status < 300) return 'success';
	else if (status >= 300 && status < 400) return 'redirect';
	else if (status >= 400 && status < 500) return 'errorsClient';
	else if (status >= 500 && status < 600) return 'errorsServer';
	else return undefined;
};
export const ennobleApiError = (error: ApiError): string => {
	const mainStore = useMainStore();
	const res = mainStore.t.m.response;
	const err = error.getError();
	const sec = getDictSec(error.getStatus());
	if (!hasResponseKey(err)) return res.unknown.message;
	const key = RESPONSES[err];
	if (!sec || !res[sec] || !hasOwnStringKey(res[sec], key)) return res.unknown.message;
	return res[sec][key];
};
export const ennobleError = (error: unknown): string => {
	if (error instanceof ApiError) return ennobleApiError(error);
	const mainStore = useMainStore();
	return mainStore.t.m.response.unknown.message;
};
