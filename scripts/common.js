function generateRandomString(length = 32) {
	let chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let numChars = chars.length;
	let string = "";
	for(var i = 0; i < length; i++) {
		string += chars.substr(Math.floor(Math.random() * numChars), 1);
	}
	return string;
}
function sortObjects(array, field) {
	let sorted = array.slice().sort(function(a, b) {
		if(a[field] > b[field]) {
			return 1;
		}
		if(a[field] < b[field]) {
			return -1;
		}
		return 0;
	});
	return sorted;
}
function sortObjectsByProximity(array) {
	let
		dlt, dln, indexNearest,
		distCurrent,
		distMin = 255,
		lastIndex = 0
	;
	while(array.length > lastIndex + 1) {
		for(var i = lastIndex; i < array.length; i++) {
			if(array[i].latitude * array[lastIndex].latitude < 0) {
				dlt = Math.abs(array[i].latitude - array[lastIndex].latitude);
			} else {
				dlt = Math.abs(array[i].latitude) + Math.abs(array[lastIndex].latitude);
			}
			if(array[i].longitude * array[lastIndex].longitude < 0) {
				dln = Math.abs(array[i].longitude - array[lastIndex].longitude);
			} else {
				dln = Math.abs(array[i].longitude) + Math.abs(array[lastIndex].longitude);
			}
			distCurrent = Math.sqrt(Math.pow(dlt, 2) + Math.pow(dln, 2));
			if(distCurrent < distMin) {
				distMin = distCurrent;
				indexNearest = i;
			}
		}
		distMin = 255;
		array.splice(++lastIndex, 0, array.splice(indexNearest, 1)[0]);
	}
}
