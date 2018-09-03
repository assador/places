function generateRandomString(length = 32) {
	let chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let numChars = chars.length;
	let string = "";
	for(var i = 0; i < length; i++) {
		string += chars.substr(Math.floor(Math.random() * numChars), 1);
	}
	return string;
}
