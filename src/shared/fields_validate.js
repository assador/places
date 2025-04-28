export const validateField = (value, type) => {
    const re = {
        'integer': /^-?\d+$/,
        'integerm': /^\d+$/,
        'decimal': /^-?\d+(?:\.\d+)?$/,
        'decimalm': /^\d+(?:\.\d+)?$/,
        'latlong': /^-?(?:\d){1,3}(?:\.\d+)?$/,
        'login': /^.{1,24}$/,
        'password': /^.{0,255}$/,
        'name': /^.{0,100}$/,
        'longname': /^.{0,500}$/,
        'description': /^.{0,2044}$/,
        'e-mail': /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
        'phone': /^[+\d]*$/,
    };
    if (typeof value !== 'string' || typeof re[type] === 'undefined') {
        throw 'Illegal function attributes';
    }
    return re[type].test(value);
};
export const makeFieldsValidatable = (voc, anyway) => {
    const fields = {
        'authLogin': ['login', voc.i.hints.fvNotMore24],
        'forgotEmail': ['e-mail', voc.i.hints.fvEmailExample],
        'regLogin': ['login', voc.i.hints.fvNotMore24],
        'accountLogin': ['login', voc.i.hints.fvNotMore24],
        'authPassword': ['password', voc.i.hints.fvNotMore255],
        'regPassword': ['password', voc.i.hints.fvNotMore255],
        'regPasswordRepeat': ['password', voc.i.hints.fvNotMore255],
        'accountPassword': ['password', voc.i.hints.fvNotMore255],
        'accountNewPassword': ['password', voc.i.hints.fvNotMore255],
        'accountNewPasswordRepeat': ['password', voc.i.hints.fvNotMore255],
        'regName': ['name', voc.i.hints.fvNotMore100],
        'accountName': ['name', voc.i.hints.fvNotMore100],
        'folderName': ['longname', voc.i.hints.fvNotMore500],
        'folderDescription': ['description', voc.i.hints.fvNotMore2044],
        'regPhone': ['phone', voc.i.hints.fvPhoneExample],
        'accountPhone': ['phone', voc.i.hints.fvPhoneExample],
        'regEmail': ['e-mail', voc.i.hints.fvEmailExample],
        'accountEmail': ['e-mail', voc.i.hints.fvEmailExample],
        'email': ['e-mail', voc.i.hints.fvEmailExample],
        'detailed-latitude': ['latlong', voc.i.hints.fvLatLonExample],
        'detailed-longitude': ['latlong', voc.i.hints.fvLatLonExample],
        'detailed-id': ['integerm', voc.i.hints.fvIdExample],
        'detailed-srt': ['decimal', voc.i.hints.fvSrtExample],
    };
    for (const id in fields) {
        const field = document.getElementById(id);
        if (field && (!field.classList.contains('value_validatable') || anyway)) {
            field.classList.add('value_validatable');
            field.title = fields[id][1];
            field.addEventListener('input', event => {
                if (event.currentTarget.value !== '') {
                    if (validateField(event.currentTarget.value, fields[id][0])) {
                        event.currentTarget.classList.remove('value_wrong');
                        event.currentTarget.classList.add('value_correct');
                    }
                    else {
                        event.currentTarget.classList.remove('value_correct');
                        event.currentTarget.classList.add('value_wrong');
                    }
                }
            }, false);
        }
    }
};
//# sourceMappingURL=fields_validate.js.map