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
		return a[field] - b[field];
	});
	return sorted;
}
function sortTree(tree) {
	tree.sort(function(a, b) {
		if(a.srt > b.srt) {
			return 1;
		} else {
			return -1;
		}
	});
}
