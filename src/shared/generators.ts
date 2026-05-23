export const generateRandomString = (length = 32): string => {
	const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const numChars: number = chars.length;
	let string = '';
	let index: number;
	for (let i = 0; i < length; i++) {
		index = Math.floor(Math.random() * numChars);
		string += chars.substring(index, index + 1);
	}
	return string;
};
