export const constants = {
	host: "http://places.scrofa-tridens.ru",
	from: "service@places.scrofa-tridens.ru",
	shortcuts: {
		65  : "add",
		68  : "delete",
		70  : "add folder",
		77  : "edit mode",
		73  : "import",
		69  : "export",
		83  : "save",
		72  : "help",
		82  : "revert",
		81  : "quit",
		79  : "other",
		80  : "placemarks",
		219 : "other placemarks",
		67  : "center",
		27  : "close",
		37  : "left",
		39  : "right",
		90  : "undo",
		89  : "redo",
	},
	mimes: {
		"image/gif"     : "gif",
		"image/jpeg"    : "jpg",
		"image/png"     : "png",
		"image/svg+xml" : "svg",
	},
	dirs: {
		common: "/var/www/places/",
		uploads: {
			images: {
				big: "/uploads/images/big/",
				small: "/uploads/images/small/",
				orphanedbig: "/uploads/images/big/orphaned/",
				orphanedsmall: "/uploads/images/small/orphaned/",
			},
		},
	},
	backupscount: 10,
	uploadsize: 12582912,
	acceptsize: 4194304,
	commonplacesonpagecount: 5,
	map: {
		initial: {
			latitude  : 51.4778883,
			longitude : -0.0014822,
		},
	},
	sidebars: {
		top    : 90,
		right  : 200,
		bottom : 60,
		left   : 200,
	},
}
