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
		distMin = 10,
		lastIndex = 0
	;
	while(array.length > lastIndex + 1) {
		for(var i = lastIndex + 1; i < array.length; i++) {
			llt = array[lastIndex].latitude * Math.PI / 180;
			lln = array[lastIndex].longitude * Math.PI / 180;
			clt = array[i].latitude * Math.PI / 180;
			cln = array[i].longitude * Math.PI / 180;
			distCurrent =
				Math.acos(
					Math.sin(llt) * Math.sin(clt) +
					Math.cos(llt) * Math.cos(clt) * Math.cos(cln - lln)
				)
			;
			if(distCurrent < distMin) {
				distMin = distCurrent;
				indexNearest = i;
			}
		}
		distMin = 10;
		array.splice(lastIndex++ + 1, 0, array.splice(indexNearest, 1)[0]);
	}
}
