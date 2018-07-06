function validate_field(value, type) {
	var re = {
		"integer"  : /^-?\d+$/,
		"integerm" : /^\d+$/,
		"decimal"  : /^-?\d+(?:\.\d+)?$/,
		"decimalm" : /^\d+(?:\.\d+)?$/,
		"latlong"  : /^-?(?:\d){1,3}(?:\.\d+)?$/,
		"e-mail"   : /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i,
		"phone"    : /^\+\d+\s*[(-]?\s*\d{2,}\s*[)-]?\s*(?:\d|\d\s*-\s*\d){2,}$/,
		"names"    : /^(?:[а-яА-Я]|[а-яА-Я][-'\u2019][а-яА-Я]|\s(?!:\s|$)|[а-яА-Я]\.(?=\s|\u00A0|$))+$/,
		"street"   : /^(?:[а-яА-Я]|[а-яА-Я][-'\u2019][а-яА-Я]|\s(?!:\s|$)|[а-яА-Я]\.(?=\s|\u00A0|$)|[а-яА-Я]\,(?=\s|\u00A0)|\d+[\s-][а-яА-Я])+$/,
		"building" : /^(?:\d|\d[\s\u00A0]*\/[\s\u00A0]*\d|\s(?!:\s|$)|(?:д|корп|стр)\.(?=\s*\d)|\d\,(?=\s|\u00A0))+$/,
		"postcode" : /^\d{6}$/,
		"locality" : /^(?:[а-яА-Я]|[а-яА-Я][-'\u2019][а-яА-Я]|\s(?!:\s|$)|[а-яА-Я]\.(?=\s|\u00A0|$))+$/,
	}
	if(typeof value !== "string" || typeof re[type] === "undefined") {throw "Illegal function attributes";}
	return re[type].test(value);
}
function make_fields_validatable() {
	var fields = {
		"email"              : ["e-mail",   "Пример: my.Name@хост.рф"],
		"detailed-latitude"  : ["latlong",  "Пример: 55.5555555"],
		"detailed-longitude" : ["latlong",  "Пример: 55.5555555"],
		"detailed-id"        : ["integerm", "Пример: 238"],
		"detailed-srt"       : ["decimalm", "Пример: 3.752"],
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
