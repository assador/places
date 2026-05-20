export const constants = {
	version: 'v6.3.7 beta',
	shortcuts: {
		KeyA : 'add',
		KeyD : 'delete',
		KeyF : 'add folder',
		KeyN : 'normal mode',
		KeyR : 'routes mode',
		KeyM : 'measure mode',
		KeyI : 'import',
		KeyE : 'export',
		KeyS : 'save',
		KeyH : 'help',
		KeyQ : 'quit',
		KeyP : 'placemarks',
		KeyC : 'center',
		KeyZ : 'undo',
		KeyY : 'redo',
	},
	dirs: {
		uploads: {
			images: {
				big: '/uploads/images/big/',
				small: '/uploads/images/small/',
				orphanedbig: '/uploads/images/big/orphaned/',
				orphanedsmall: '/uploads/images/small/orphaned/',
			},
		},
	},
	sessionlifetime: 3600,
	backupscount: 10,
	commonplacesonpagecount: 5,
	commonroutesonpagecount: 5,
	map: {
		initial: {
			latitude  : 0,
			longitude : 0,
			zoom      : 15,
		},
		precision: 7,
	},
	sidebars: {
		top    : { act: 95, min: 0, max: Infinity },
		right  : { act: 250, min: 0, max: Infinity },
		bottom : { act: 57, min: 0, max: Infinity },
		left   : { act: 250, min: 0, max: Infinity },
		center : { min: 200 },
	},
	sidebarsCompact: {
		top    : { act: 80, min: 0, max: Infinity },
		right  : { act: 200, min: 0, max: Infinity },
		bottom : { act: 95, min: 0, max: Infinity },
		left   : { act: 200, min: 0, max: Infinity },
		center : { min: 200 },
	},
	sidebarsCompactUltra: {
		top    : { act: 80, min: 0, max: Infinity },
		right  : { act: 0, min: 0, max: Infinity },
		bottom : { act: 95, min: 0, max: Infinity },
		left   : { act: 0, min: 0, max: Infinity },
		center : { min: 200 },
	},
	compact: 1000,
	compactUltra: 800,
	earthRadius: 6371,
	links: {
		service: 'https://places.scrofa-tridens.ru/',
		repository: 'https://github.com/assador/places',
		contacts: {
			email: 'mailto:places@scrofa-tridens.ru',
		},
		publications: {
			habr: 'https://habr.com/ru/articles/1009226/',
		},
		donate: {
			boosty: 'https://boosty.to/assador/donate',
		},
	},
};
