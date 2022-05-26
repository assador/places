import store from '@/store';

export const validateField = (value: string, type: string): boolean => {
	const re: Record<string, RegExp> = {
		'integer'     : /^-?\d+$/,
		'integerm'    : /^\d+$/,
		'decimal'     : /^-?\d+(?:\.\d+)?$/,
		'decimalm'    : /^\d+(?:\.\d+)?$/,
		'latlong'     : /^-?(?:\d){1,3}(?:\.\d+)?$/,
		'login'       : /^.{1,24}$/,
		'password'    : /^.{0,255}$/,
		'name'        : /^.{0,100}$/,
		'longname'    : /^.{0,500}$/,
		'description' : /^.{0,2044}$/,
		'e-mail'      : /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
		'phone'    : /^[+\d]*$/,
	}
	if (typeof value !== 'string' || typeof re[type] === 'undefined') {throw 'Illegal function attributes';}
	return re[type].test(value);
};
export const makeFieldsValidatable = (anyway?: boolean): void => {
	const fields: Record<string, string[]> = {
		'authLogin'                : ['login',       store.state.t.i.hints.fvNotMore24],
		'forgotEmail'              : ['e-mail',      store.state.t.i.hints.fvEmailExample],
		'regLogin'                 : ['login',       store.state.t.i.hints.fvNotMore24],
		'accountLogin'             : ['login',       store.state.t.i.hints.fvNotMore24],
		'authPassword'             : ['password',    store.state.t.i.hints.fvNotMore255],
		'regPassword'              : ['password',    store.state.t.i.hints.fvNotMore255],
		'regPasswordRepeat'        : ['password',    store.state.t.i.hints.fvNotMore255],
		'accountPassword'          : ['password',    store.state.t.i.hints.fvNotMore255],
		'accountNewPassword'       : ['password',    store.state.t.i.hints.fvNotMore255],
		'accountNewPasswordRepeat' : ['password',    store.state.t.i.hints.fvNotMore255],
		'regName'                  : ['name',        store.state.t.i.hints.fvNotMore100],
		'accountName'              : ['name',        store.state.t.i.hints.fvNotMore100],
		'folderName'               : ['longname',    store.state.t.i.hints.fvNotMore500],
		'folderDescription'        : ['description', store.state.t.i.hints.fvNotMore2044],
		'regPhone'                 : ['phone',       store.state.t.i.hints.fvPhoneExample],
		'accountPhone'             : ['phone',       store.state.t.i.hints.fvPhoneExample],
		'regEmail'                 : ['e-mail',      store.state.t.i.hints.fvEmailExample],
		'accountEmail'             : ['e-mail',      store.state.t.i.hints.fvEmailExample],
		'email'                    : ['e-mail',      store.state.t.i.hints.fvEmailExample],
		'detailed-latitude'        : ['latlong',     store.state.t.i.hints.fvLatLonExample],
		'detailed-longitude'       : ['latlong',     store.state.t.i.hints.fvLatLonExample],
		'detailed-id'              : ['integerm',    store.state.t.i.hints.fvIdExample],
		'detailed-srt'             : ['decimal',     store.state.t.i.hints.fvSrtExample],
	}
	for (const id in fields) {
		const field = document.getElementById(id);
		if (field && (!field.classList.contains('value_validatable') || anyway)) {
			field.classList.add('value_validatable');
			field.title = fields[id][1];
			field.addEventListener('input', event => {
				if ((<HTMLInputElement>event.currentTarget).value !== '') {
					if (validateField((<HTMLInputElement>event.currentTarget).value, fields[id][0])) {
						(<HTMLElement>event.currentTarget).classList.remove('value_wrong');
						(<HTMLElement>event.currentTarget).classList.add('value_correct');
					} else {
						(<HTMLElement>event.currentTarget).classList.remove('value_correct');
						(<HTMLElement>event.currentTarget).classList.add('value_wrong');
					}
				}
			}, false);
		}
	}
};
