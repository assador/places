function validate_field(value, type) {
	var re = {
		"integer"  : /^-?\d+$/,
		"integerm" : /^\d+$/,
		"decimal"  : /^-?\d+(?:\.\d+)?$/,
		"decimalm" : /^\d+(?:\.\d+)?$/,
		"latlong"  : /^-?(?:\d){1,3}(?:\.\d+)?$/,
		"login"    : /^.{1,24}$/,
		"name"     : /^.{0,100}$/,
		"e-mail"   : /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
		"phone"    : /^[+\d]*$/,
	}
	if(typeof value !== "string" || typeof re[type] === "undefined") {throw "Illegal function attributes";}
	return re[type].test(value);
}
function make_fields_validatable() {
	var fields = {
		"authLogin"          : ["login",    "Не более 24 символов"],
		"regLogin"           : ["login",    "Не более 24 символов"],
		"authPassword"       : ["login",    "Не более 24 символов"],
		"regPassword"        : ["login",    "Не более 24 символов"],
		"regPasswordRepeat"  : ["login",    "Не более 24 символов"],
		"regName"            : ["name",     "Не более 100 символов."],
		"regPhone"           : ["phone",    "Слитно, с ведущим +7. Пример: +71234567890"],
		"regEmail"           : ["e-mail",   "Пример: my.Name@хост.рф"],
		"email"              : ["e-mail",   "Пример: my.Name@хост.рф"],
		"detailed-latitude"  : ["latlong",  "Пример: 55.5555555"],
		"detailed-longitude" : ["latlong",  "Пример: 55.5555555"],
		"detailed-id"        : ["integerm", "Пример: 238"],
		"detailed-srt"       : ["decimal", "Пример: 3.752"],
	}
	for(var id in fields) {
		if(document.getElementById(id)) {
			document.getElementById(id).classList.add("value_validatable");
			document.getElementById(id).title = fields[id][1];
			document.getElementById(id).addEventListener("input", (function(type) {return function() {
				if(this.value != "") {
					if(validate_field(this.value, type)) {
						this.classList.remove("value_wrong");
						this.classList.add("value_correct");
					} else {
						this.classList.remove("value_correct");
						this.classList.add("value_wrong");
					}
				}
			}}(fields[id][0])), false);
		}
	}
}
