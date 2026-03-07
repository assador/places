import { EntityCollection, Folder, Point, Place } from '@/types';

// SEC Export

const escapeXML = (str: string): string => {
	return str.replace(/[<>&"']/g, (match) => {
		const entities: Record<string, string> = {
			'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
		};
		return entities[match];
	});
};
export const generateGPX = ({
	places,
	pointsDict,
}: {
	places: Record<string, Place>;
	pointsDict: Record<string, Point>;
}): string => {
	const header = [
		'<?xml version="1.0" encoding="utf-8" standalone="yes"?>',
		'<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">',
	].join('');
	const wpts = Object.values(places).map(p => {
		const wp = pointsDict[p.pointid];
		if (!wp) return '';
		let node = `<wpt lat="${wp.latitude}" lon="${wp.longitude}">`;
		if (p.name) node += `<name>${escapeXML(p.name)}</name>`;
		if (p.description) node += `<desc>${escapeXML(p.description)}</desc>`;
		if (p.link) node += `<link href="${escapeXML(p.link)}"></link>`;
		if (p.time) node += `<time>${p.time}</time>`;
		node += '</wpt>';
		return node;
	}).join('');
	return `${header}${wpts}</gpx>`;
};
export const generateJSON = ({
	places,
	pointsDict,
	foldersDict,
}: {
	places: Record<string, Place>;
	pointsDict: Record<string, Point>;
	foldersDict: Record<string, Folder>;
}): string => {

	const pointsSet = new Set<string>();
	const exportFoldersDict: Record<string, any> = {};

	const addFolderWithParents = (folderId: string) => {
		let currentId = folderId;
		while (currentId && foldersDict[currentId]) {
			if (exportFoldersDict[currentId]) break;
			const f = foldersDict[currentId];
			const {
				type,
				show,
				added,
				deleted,
				updated,
				geomarks,
				open,
				...cleanFolder
			} = f as any;
			exportFoldersDict[currentId] = cleanFolder;
			currentId = f.parent as string;
		}
	};
	const placesArray = Object.values(places).map((p) => {
		const {
			type,
			show,
			added,
			deleted,
			updated,
			geomark,
			images,
			...cleanPlace
		} = p as any;
		if (p.pointid && pointsDict[p.pointid]) pointsSet.add(p.pointid);
		if (p.folderid) addFolderWithParents(p.folderid);
		return cleanPlace;
	});
	const pointsArray = Array.from(pointsSet).map((id) => {
		const {
			type,
			show,
			added,
			deleted,
			updated,
			...cleanPoint
		} = pointsDict[id] as any;
		return cleanPoint;
	});
	const foldersArray = Object.values(exportFoldersDict);

	return JSON.stringify({
		places: placesArray,
		points: pointsArray,
		folders: foldersArray,
	}, null, 2);
};

// SEC Import

export const entitiesFromJSON = (text: string): EntityCollection | null => {
	try {
		const entities: EntityCollection = JSON.parse(text);
		return entities;
	} catch (e) {
		console.error(e);
		return null;
	}
}
export const entitiesFromGPX = (text: string): EntityCollection | null => {
	try {
		const entities: EntityCollection = {};
		return entities;
	} catch (e) {
		console.error(e);
		return null;
	}
}
/*
const parseGPX = (text: string) => {
	const result = {
		points: [] as Array<Point>,
		places: [] as Array<Place>,
		tree: {} as Folder,
	};
	// Parsing XML text to a DOM tree
	let dom = null;
	try {
		dom = (new DOMParser()).parseFromString(
			text, 'text/xml'
		);
	} catch (e) {
		console.error(e);
		this.setMessage(this.t.m.popup.parsingImportError + ': ' + e);
		return null;
	}
	if (this.trees.places.imported) {
		result.tree = this.trees.places.imported;
	}
	let importedPlaceFolder, importedFolder: Folder;
	let description = '', time = '';
	for (const wpt of dom.getElementsByTagName('wpt')) {
		// Parsing a time node in a place node
		time = '';
		if (wpt.getElementsByTagName('time').length) {
			time = wpt.getElementsByTagName('time')[0].textContent.trim();
		}
		// Updating the tree branch of folders for imported places
		// and get an ID of a folder for the importing place
		importedPlaceFolder = formFolderForImported(
			this.t,
			time.slice(0, 10),
			importedFolder
		);
		importedFolder = importedPlaceFolder.imported;
		// Parsing a description node in a place node
		description = '';
		if (wpt.getElementsByTagName('desc').length) {
			for (const desc of wpt.getElementsByTagName('desc')[0].childNodes) {
				try {
					switch (desc.nodeType) {
						case 1 : case 3 :
							description +=
								desc.textContent.trim() +
								(desc.nextSibling ? '\n' : '');
							break;
						case 4 :
							const reStr: string =
								'desc_(?:user|test)' +
								'\s*\:\s*start\s*--\s*>\s*' +
								'(.*?)' +
								'\s*<\s*\!\s*--\s*' +
								'desc_(?:user|test)' +
								'\s*\:\s*end'
							;
							const descs = desc.textContent.match(
								new RegExp(reStr, 'gi')
							);
							for (let i = 0; i < descs.length; i++) {
								description += descs[i].replace(
									new RegExp(reStr, 'i'), '$1'
								) + (desc.nextSibling ? '\n' : '');
							}
							break;
					}
				} catch (e) {console.error(e);}
			}
		}
		// Forming an importing place as an object and pushing it in a structure
		const newPointId = crypto.randomUUID();
		const newPlaceId = crypto.randomUUID();
		const newPoint = {
			id: newPointId,
			userid: localStorage.getItem('places-useruuid'),
			latitude:
				Number(wpt.getAttribute('lat')) ||
				Number(constants.map.initial.latitude) ||
				null,
			longitude:
				Number(wpt.getAttribute('lon')) ||
				Number(constants.map.initial.longitude) ||
				null,
			time: time,
			type: 'point',
			common: false,
			added: true,
			deleted: false,
			updated: false,
			show: true,
		};
		const newPlace = {
			id: newPlaceId,
			pointid: newPointId,
			folderid: importedPlaceFolder.folderid,
			name: (wpt.getElementsByTagName('name').length
				? wpt.getElementsByTagName('name')[0].textContent.trim()
				: ''
			),
			description: description,
			link: (wpt.getElementsByTagName('link').length
				? wpt.getElementsByTagName('link')[0].getAttribute('href').trim()
				: ''
			),
			time: time,
			srt: (Object.keys(result.places).length
				? Object.keys(result.places).length + 1
				: 0
			),
			common: false,
			geomark: true,
			userid: localStorage.getItem('places-useruuid'),
			images: {},
			type: 'place',
			added: true,
			deleted: false,
			updated: false,
			show: true,
		};
		result.points.push(newPoint);
		result.places.push(newPlace);
	}
	result.tree = importedPlaceFolder.imported;
	return result;
}
*/
