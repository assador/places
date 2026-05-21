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
export const formFoldersCheckedIds = (): string[] => {
	const foldersCheckedIds = [];
	if (document.getElementById('popup-export__tree')) {
		let check: boolean;
		for (const folder of
			document.getElementById('popup-export__tree')
				.getElementsByClassName('folder')
		) {
			check = true;
			for (const placeCheckbox of
				folder.getElementsByClassName('to-export-place-checkbox')
			) {
				if (!(placeCheckbox as HTMLInputElement).checked) {
					check = false;
					break;
				}
			}
			if (check) {
				foldersCheckedIds.push(
					folder.id.match(/^to-export-places-menu-folder-(.+)$/)[1]
				);
			}
		}
	}
	return foldersCheckedIds;
};
