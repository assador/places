function generateRandomString(length = 32) {
	let chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let numChars = chars.length;
	let string = "";
	for(let i = 0; i < length; i++) {
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
		for(let i = lastIndex + 1; i < array.length; i++) {
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
function childrenCount(tree, childrenKey, result = 0) {
	if(Array.isArray(tree[childrenKey])) {
		for(let i = 0; i < tree[childrenKey].length; i++) {
			result = childrenCount(tree[childrenKey][i], childrenKey, ++result);
		}
	}
	return result;
}
function findInTree(tree, childrenKey, key, value, result) {
	if(tree[key] === value) {
		return tree;
	}
	if(Array.isArray(tree[childrenKey])) {
		for(let i = 0; i < tree[childrenKey].length; i++) {
			if(tree[childrenKey][i][key] === value) {
				return tree[childrenKey][i];
			}
			result = findInTree(tree[childrenKey][i], childrenKey, key, value, result);
			if(result) {
				return result;
			}
		}
	}
}
function changeByKeyValue(tree, childrenKey, key, value, what) {
	if(Array.isArray(tree[childrenKey]) && tree[childrenKey].length > 0) {
		for(let i = 0; i < tree[childrenKey].length; i++) {
			switch(what) {
				case "delete" :
					if(tree[childrenKey][i][key] === value) {
						tree[childrenKey].splice(
							tree[childrenKey].indexOf(tree[childrenKey][i]), 1
						);
						i--;
					} else {
						changeByKeyValue(
							tree[childrenKey][i], childrenKey, key, value, what
						);
					}
					break;
				case "change" :
					tree[childrenKey][i][key] = value;
					changeByKeyValue(
						tree[childrenKey][i], childrenKey, key, value, what
					);
					break;
			}
		}
	}
}
function treeToPlain(tree, childrenKey, plain) {
	if(Array.isArray(tree[childrenKey]) && tree[childrenKey].length > 0) {
		let plained;
		for(let i = 0; i < tree[childrenKey].length; i++) {
			plained = JSON.parse(JSON.stringify(tree[childrenKey][i]));
			delete plained[childrenKey];
			plain.push(plained);
			result = treeToPlain(tree[childrenKey][i], childrenKey, plain);
		}
		return result;
	}
}
function treeNewIds(tree, childrenKey, parentKey, items, itemParentKey) {
	let newId = tree.id === "root" ? null : generateRandomString(32);
	if(Array.isArray(items) && items.length > 0) {
		for(let i = 0; i < items.length; i++) {
			if(items[i][itemParentKey] === tree.id) {
				items[i].id = generateRandomString(32);
				items[i][itemParentKey] = newId;
			}
		}
	}
	tree.id = newId;
	if(Array.isArray(tree[childrenKey]) && tree[childrenKey].length > 0) {
		for(let i = 0; i < tree[childrenKey].length; i++) {
			tree[childrenKey][i][parentKey] = tree.id;
			treeNewIds(
				tree[childrenKey][i],
				childrenKey,
				parentKey,
				items,
				itemParentKey
			);
		}
	}
}
function isParentInTree(tree, childrenKey, parentId, childId, parent) {
	if(typeof(parent) === "undefined") {
		parent = findInTree(tree, childrenKey, "id", parentId);
	}
	if(Array.isArray(parent[childrenKey]) && parent[childrenKey].length > 0) {
		for(let i = 0; i < parent[childrenKey].length; i++) {
			if(parent[childrenKey][i].id === childId) {
				return true;
			}
			if(isParentInTree(tree, childrenKey, parentId, childId, parent[childrenKey][i])) {
				return true;
			}
		}
	}
	return false;
}
function plainToTree(plain) {
	let tree = [], ready = false;
	while(!ready && plain.length > 0) {
		for(let i = 0; i < plain.length; i++) {
			ready = true;
			if(!plain[i].builded) {
				if(plain[i].parent === null) {
					tree.push(plain[i]);
					plain[i].builded = true;
					ready = false;
					i--;
				} else {
					for(let y = 0; y < plain.length; y++) {
						if(plain[y].id === plain[i].parent) {
							if(!plain[y].children) {
								plain[y].children = [];
							}
							plain[y].children.push(plain[i]);
							plain[i].builded = true;
							ready = false;
							i--;
							break;
						}
						
					}
				}
			}
		}
	}
	return tree;
}
/**
 * Creation of a folder for the imported places
 * in the folder tree branch for imported places.
 * Returns a string with ID of the created folder.
 * formFolderForImported(
 *     <time string YYYY-MM-DDTHH:MM:SS>,
 *     [<object of a root folder for imported places>]
 * )
 */
function formFolderForImported(time, imported) {
	if(!imported || !imported.id) {
		imported = {
			type: "folder",
			builded: false,
			opened: false,
			added: true,
			deleted: false,
			updated: false,
			show: true,
			id: "imported",
			parent: null,
			name: "Импортированное",
			description: "Импортированные места",
			srt: 99999,
			children: [],
		};
	}
	if(!time) {
		return {imported: imported, folderid: "imported"};
	} else {
		let date = {
			y: time.slice(0, 4),
			m: time.slice(5, 7),
			d: time.slice(8, 10),
		};
		let folders = {};
		for(let y of imported.children) {
			if(y.name === date.y) {
				folders.y = y;
				break;
			}
		}
		if(!folders.y) {
			folders.y = {
				type: "folder",
				builded: false,
				opened: false,
				added: true,
				deleted: false,
				updated: false,
				show: true,
				id: generateRandomString(32),
				parent: imported.id,
				name: date.y,
				description: "",
				srt: imported.children.length > 0
					? imported.children[imported.children.length - 1].srt + 1
					: 1,
				children: [],
			};
			imported.children.push(folders.y);
		}
		for(let m of folders.y.children) {
			if(m.name === date.m) {
				folders.m = m;
				break;
			}
		}
		if(!folders.m) {
			folders.m = {
				type: "folder",
				builded: false,
				opened: false,
				added: true,
				deleted: false,
				updated: false,
				show: true,
				id: generateRandomString(32),
				parent: folders.y.id,
				name: date.m,
				description: "",
				srt: folders.y.children.length > 0
					? folders.y.children[folders.y.children.length - 1].srt + 1
					: 1,
				children: [],
			};
			folders.y.children.push(folders.m);
		}
		for(let d of folders.m.children) {
			if(d.name === date.d) {
				folders.d = d;
				break;
			}
		}
		if(!folders.d) {
			folders.d = {
				type: "folder",
				builded: false,
				opened: false,
				added: true,
				deleted: false,
				updated: false,
				show: true,
				id: generateRandomString(32),
				parent: folders.m.id,
				name: date.d,
				description: "",
				srt: folders.m.children.length > 0
					? folders.m.children[folders.m.children.length - 1].srt + 1
					: 1,
				children: [],
			};
			folders.m.children.push(folders.d);
		}
		return {imported: imported, folderid: folders.d.id};
	}
}
function scrollWindow(amount) {
	window.scrollBy({top: amount, behavior: "smooth"});
}
