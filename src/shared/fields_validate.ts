export const validateField = (value, type) => {
	const re = {
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
}
export const makeFieldsValidatable = () => {
	const fields = {
		'authLogin'                : ['login',       'Не более 24 символов'],
		'forgotEmail'              : ['e-mail',      'Пример: my.Name@хост.рф'],
		'regLogin'                 : ['login',       'Не более 24 символов'],
		'accountLogin'             : ['login',       'Не более 24 символов'],
		'authPassword'             : ['password',    'Не более 255 символов'],
		'regPassword'              : ['password',    'Не более 255 символов'],
		'regPasswordRepeat'        : ['password',    'Не более 255 символов'],
		'accountPassword'          : ['password',    'Не более 255 символов'],
		'accountNewPassword'       : ['password',    'Не более 255 символов'],
		'accountNewPasswordRepeat' : ['password',    'Не более 255 символов'],
		'regName'                  : ['name',        'Не более 100 символов.'],
		'accountName'              : ['name',        'Не более 100 символов.'],
		'folderName'               : ['longname',    'Не более 500 символов.'],
		'folderDescription'        : ['description', 'Не более 2044 символов.'],
		'regPhone'                 : ['phone',       'Слитно, с ведущим +7. Пример: +71234567890'],
		'accountPhone'             : ['phone',       'Слитно, с ведущим +7. Пример: +71234567890'],
		'regEmail'                 : ['e-mail',      'Пример: my.Name@хост.рф'],
		'accountEmail'             : ['e-mail',      'Пример: my.Name@хост.рф'],
		'email'                    : ['e-mail',      'Пример: my.Name@хост.рф'],
		'detailed-latitude'        : ['latlong',     'Пример: 55.5555555'],
		'detailed-longitude'       : ['latlong',     'Пример: 55.5555555'],
		'detailed-id'              : ['integerm',    'Пример: 238'],
		'detailed-srt'             : ['decimal',     'Пример: 3.752'],
	}
	for (const id in fields) {
		if (document.getElementById(id)) {
			document.getElementById(id).classList.add('value_validatable');
			document.getElementById(id).title = fields[id][1];
			document.getElementById(id).addEventListener('input', (event) => {
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
}
