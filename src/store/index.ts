import { constants } from '../shared/constants'
import { bus } from '../shared/bus'
import commonFunctions from '../shared/common'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const tracking = (store) => {
	const trackingMutations: string[] = [
		'addFolder',
		'addImporting',
		'addPlace',
		'changeFolder',
		'changePlace',
		'deleteFolder',
		'deletePlace',
		'modifyFolders',
		'modifyPlaces',
		'removePlace',
		'swapValues',
	];
	store.subscribe((mutation, state) => {
		if(
			mutation.type != 'setIdleTime' &&
			mutation.type != 'setRefreshing' &&
			!state.refreshing
		) {
			sessionStorage.setItem('places-store-state', JSON.stringify(state));
		}
		if(trackingMutations.includes(mutation.type) && mutation.payload) {
			store.commit('setSaved', false);
			if(
				(
					!mutation.payload.hasOwnProperty('backup') ||
					mutation.payload.backup
				) && (
					mutation.payload.hasOwnProperty('type') ||
					mutation.payload.hasOwnProperty('change')
				)
			) {
				if(
					mutation.payload.added ||
					mutation.payload.deleted ||
					mutation.payload.updated ||
					mutation.payload.change &&
						(
							mutation.payload.change.added ||
							mutation.payload.change.deleted ||
							mutation.payload.change.updated
						)
				) {
					if(!state.inUndoRedo) {
						if(mutation.payload.hasOwnProperty('type')) {
							bus.$emit('toDB', {what: mutation.payload.type + 's'});
							store.commit('savedToDB', mutation.payload);
						}
						if(mutation.payload.hasOwnProperty('change')) {
							if(mutation.payload.hasOwnProperty('place')) {
								bus.$emit('toDB', {what: 'places'});
								store.commit('savedToDB', mutation.payload.place);
							}
							if(mutation.payload.hasOwnProperty('folder')) {
								bus.$emit('toDB', {what: 'folders'});
								store.commit('savedToDB', mutation.payload.folder);
							}
						}
					} else {
						bus.$emit('toDBCompletely');
						store.commit('outUndoRedo');
					}
				}
				if(mutation.type !== 'removePlace') {
					store.commit('backupState');
				}
			}
		}
	});
}

const store = new Vuex.Store({
	plugins: [tracking],
	state: {
		refreshing: false,
		saved: true,
		idleTime: 0,
		stateBackups: [],
		stateBackupsIndex: -1,
		inUndoRedo: false,
		user: null,
		currentPlace: null,
		homePlace: null,
		currentPlaceIndex: -1,
		places: [],
		folders: [],
		commonPlaces: [],
		center: {
			latitude: constants.map.initial.latitude,
			longitude: constants.map.initial.longitude,
		},
		ready: false,
		message: '',
		placeFields: {
			name               : 'Название',
			description        : 'Описание',
			link               : 'Ссылка',
			latitude           : 'Широта',
			longitude          : 'Долгота',
			altitudecapability : 'Высота над уровнем моря (м)',
			time               : 'Время создания геометки (UTC)',
			srt                : 'Сортировка',
			common             : 'Приватность',
			images             : 'Фотографии',
		},
		lengths: {
			name        : 500,
			description : 5000,
			url         : 2048,
		},
		messageTimer: null,
	},
	mutations: {
		setMessage(state, message) {
			Vue.set(state, 'message', message);
		},
		setRefreshing(state, refreshing) {
			Vue.set(state, 'refreshing', refreshing);
		},
		setSaved(state, saved) {
			Vue.set(state, 'saved', saved);
		},
		setIdleTime(state, time) {
			Vue.set(state, 'idleTime', time);
		},
		foldersToTree(state) {
			Vue.set(state, 'folders', commonFunctions.plainToTree(state.folders));
		},
		backupState(state) {
			state.stateBackups.splice(++state.stateBackupsIndex, Infinity, {
				places: JSON.parse(JSON.stringify(state.places)),
				folders: JSON.parse(JSON.stringify(state.folders)),
				currentPlaceIndex: state.currentPlaceIndex,
			});
			Vue.set(state, 'stateBackupsIndex', state.stateBackups.length - 1);
			if(state.stateBackups.length > constants.backupscount) {
				state.stateBackups.shift();
				state.stateBackupsIndex--;
			}
		},
		restoreState(state, index) {
			Vue.set(state, 'places',
				JSON.parse(JSON.stringify(state.stateBackups[index].places))
			);
			Vue.set(state, 'folders',
				JSON.parse(JSON.stringify(state.stateBackups[index].folders))
			);
			bus.$emit('setCurrentPlace', {
				place: state.stateBackups[index].currentPlaceIndex < 0
					? null
					: state.places[state.stateBackups[index].currentPlaceIndex]
			});
		},
		stateBackupsIndexChange(state, delta) {
			Vue.set(state, 'stateBackupsIndex', state.stateBackupsIndex + delta);
		},
		inUndoRedo(state) {
			Vue.set(state, 'inUndoRedo', true);
		},
		outUndoRedo(state) {
			Vue.set(state, 'inUndoRedo', false);
		},
		reset(state) {
			Vue.set(state, 'saved', true);
			Vue.set(state, 'idleTime', 0);
			Vue.set(state, 'stateBackups', []);
			Vue.set(state, 'stateBackupsIndex', -1);
			Vue.set(state, 'inUndoRedo', false);
			Vue.set(state, 'user', null);
			Vue.set(state, 'currentPlace', null);
			Vue.set(state, 'homePlace', null);
			Vue.set(state, 'currentPlaceIndex', -1);
			Vue.set(state, 'places', []);
			Vue.set(state, 'folders', []);
			Vue.set(state, 'commonPlaces', []);
			Vue.set(state, 'center', {
				latitude: constants.map.initial.latitude,
				longitude: constants.map.initial.longitude,
			});
			Vue.set(state, 'ready', false);
			Vue.set(state, 'message', '');
			Vue.set(state, 'placeFields', {
				name               : 'Название',
				description        : 'Описание',
				link               : 'Ссылка',
				latitude           : 'Широта',
				longitude          : 'Долгота',
				altitudecapability : 'Высота над уровнем моря (м)',
				time               : 'Время создания геометки (UTC)',
				srt                : 'Сортировка',
				common             : 'Приватность',
				images             : 'Фотографии',
			});
			Vue.set(state, 'lengths', {
				name        : 500,
				description : 5000,
				url         : 2048,
			});
		},
		savedToDB(state, object) {
			Vue.set(object, 'added', false);
			Vue.set(object, 'deleted', false);
			Vue.set(object, 'updated', false);
		},
		setUser(state, user) {
			Vue.set(state, 'user', user);
		},
		setCurrentPlaceIndex(state, index) {
			Vue.set(state, 'currentPlaceIndex', index);
		},
		setHomePlace(state, id) {
			if(!id) {
				Vue.set(state, 'homePlace', null);
				Vue.set(state.user, 'homeplace', null);
				return;
			}
			for(let i = 0; i < state.places.length; i++) {
				if(state.places[i].id === id) {
					state.homePlace = state.places[i];
					state.user.homeplace = state.places[i];
					return;
				}
			}
			Vue.set(state, 'homePlace', null);
			Vue.set(state.user, 'homeplace', null);
		},
		placesReady(state, payload) {
			Vue.set(state, 'places', payload.places);
			Vue.set(state, 'commonPlaces', payload.commonPlaces);
			Vue.set(state, 'folders', payload.folders);
			Vue.set(state, 'ready', true);
			let added = false, deleted = false, updated = false;
			switch(payload.what) {
			case 'added' :
				added = true;
				break;
			case 'deleted' :
				deleted = true;
				break;
			case 'updated' :
				updated = true;
				break;
			}
			for(const place of payload.places) {
				Vue.set(place, 'type', 'place');
				Vue.set(place, 'added', added);
				Vue.set(place, 'deleted', deleted);
				Vue.set(place, 'updated', updated);
				Vue.set(place, 'show', true);
			}
			for(const folder of payload.folders) {
				Vue.set(folder, 'type', 'folder');
				Vue.set(folder, 'added', added);
				Vue.set(folder, 'deleted', deleted);
				Vue.set(folder, 'updated', updated);
				Vue.set(folder, 'opened', false);
			}
		},
		show(state, index) {
			Vue.set(state.places[index], 'show', true);
		},
		hide(state, index) {
			Vue.set(state.places[index], 'show', false);
		},
		modifyPlaces(state, places) {
			Vue.set(state, 'places', places);
		},
		modifyFolders(state, folders) {
			Vue.set(state, 'folders', folders);
		},
		modifyCommonPlaces(state, commonPlaces) {
			Vue.set(state, 'commonPlaces', commonPlaces);
		},
		addPlace(state, place) {
			Vue.set(state, 'places', state.places.concat(place));
			Vue.set(state, 'currentPlaceIndex', state.places.length - 1);
		},
		// Mark the place as to be deleted
		removePlace(state, payload) {
			Vue.set(payload.place, 'added', false);
			Vue.set(payload.place, 'deleted', true);
			Vue.set(payload.place, 'updated', false);
		},
		changePlace(state, changes) {
			const keys: string[] = Object.keys(changes.change)
			let toUpdated = true;
			for(let i = 0; i < keys.length; i++) {
				Vue.set(changes.place, keys[i], changes.change[keys[i]]);
				if(keys[i] === 'updated') {
					toUpdated = false;
				}
			}
			if(toUpdated) {
				Vue.set(changes.place, 'updated', true);
			}
		},
		addFolder(state, folder) {
			const parent = commonFunctions.findInTree(
				{id: 'root', children: state.folders},
				'children',
				'id',
				folder.parent
			);
			if(!parent) {
				state.folders.push(folder);
			} else {
				if(!parent.children) {
					Vue.set(parent, 'children', []);
				}
				parent.children.push(folder);
			}
		},
		addImporting(state, payload) {
			let found: any;
			const plainStateFolders = [], plainPayloadFolders = [];
			commonFunctions.treeToPlain({'children': state.folders}, 'children', plainStateFolders);
			commonFunctions.treeToPlain({'children': payload.folders}, 'children', plainPayloadFolders);
			Vue.set(state, 'folders', []);
			for(const payloadFolder of plainPayloadFolders) {
				payloadFolder.userid = sessionStorage.getItem('places-userid');
				/*
				 * Checking if such a folder already exists in the tree.
				 * If exists, updating; if not, addinng.
				 */
				found = plainStateFolders.find(f =>
					f.id == payloadFolder.id
				);
				if(found) {
					payloadFolder.updated = true;
					for(const key in payloadFolder) {
						if(
							key !== 'id' &&
							key !== 'added' &&
							key !== 'deleted'
						) {
							found[key] = payloadFolder[key];
						}
					}
				} else {
					payloadFolder.added = true;
					plainStateFolders.push(payloadFolder);
				}
			}
			for(const stateFolder of plainStateFolders) {
				stateFolder.builded = false;
			}
			Vue.set(state, 'folders', commonFunctions.plainToTree(plainStateFolders));
			for(const payloadPlace of payload.places) {
				payloadPlace.userid = sessionStorage.getItem('places-userid');
				/*
				 * Checking if such a place already exists.
				 * If exists, updating; if not, addinng.
				 */
				found = state.places.find(p =>
					p.id == payloadPlace.id ||
					p.time && p.time.slice(0, -5) == payloadPlace.time.slice(0, -5)
				);
				if(found) {
					found.updated = true;
					for(const key in payloadPlace) {
						Vue.set(found, key, payloadPlace[key]);
					}
				} else {
					payloadPlace.images = [];
					payloadPlace.added = true;
					Vue.set(state, 'places', state.places.concat([payloadPlace]));
				}
			}
		},
		deletePlace(state, place) {
			for(let i = 0; i < state.places.length; i++) {
				if(state.places[i] === place) {
					state.places.splice(i, 1);
					Vue.set(state, 'currentPlaceIndex',
						state.places.indexOf(state.currentPlace)
					);
					break;
				}
			}
		},
		deleteImages(state, payload) {
			if(!payload.images || payload.images.length === 0) return;
			if(payload.family) {
				for(const place of state.places) {
					if(place.id === payload.images[0].id) {
						Vue.set(place, 'images', []);
					}
				}
				return;
			}
			for(const toDelete of payload.images) {
				for(const place of state.places) {
					for(const image of place.images) {
						if(image.id === toDelete.id) {
							place.images.splice(place.images.indexOf(image), 1);
						}
					}
				}
			}
		},
		deletePlacesMarkedAsDeleted(state, payload) {
			for(let i = 0; i < state.places.length; i++) {
				if(state.places[i].deleted) {
					state.places[i] = null;
					state.places.splice(i, 1);
					i--;
				}
			}
			Vue.set(state, 'currentPlaceIndex',
				state.places.indexOf(state.currentPlace)
			);
		},
		deleteFoldersMarkedAsDeleted(state, payload) {
			commonFunctions.changeByKeyValue(
				{children: state.folders},
				'children',
				'deleted',
				true,
				'delete'
			);
		},
		changeFolder(state, changes) {
			const keys = Object.keys(changes.change);
			let toUpdated = true;
			for(let i = 0; i < keys.length; i++) {
				Vue.set(changes.folder, keys[i], changes.change[keys[i]]);
				if(keys[i] === 'updated') {
					toUpdated = false;
				}
			}
			if(toUpdated) {
				Vue.set(changes.folder, 'updated', true);
			}
		},
		folderOpenClose(state, payload) {
			if(payload.folder) {
				Vue.set(
					payload.folder,
					'opened',
					payload.hasOwnProperty('opened')
						? payload.opened
						: !payload.folder.opened
				);
			}
			if(payload.target) {
				if(payload.opened) {
					payload.target.classList.add('folder_opened');
				} else {
					if(payload.target.classList.contains('folder_opened')) {
						payload.target.classList.add('folder_closed');
						payload.target.classList.remove('folder_opened');
					} else {
						payload.target.classList.add('folder_opened');
						payload.target.classList.remove('folder_closed');
					}
				}
			}
		},
		swapValues(state, changes) {
			const p1: any = changes.parent[changes.indexes[0]];
			const p2: any = changes.parent[changes.indexes[1]];
			changes.values.forEach(function(key) {
				Vue.set(p1, key, [p2[key], Vue.set(p2, key, p1[key])][0]);
			});
			Vue.set(p1, 'updated', true);
			Vue.set(p2, 'updated', true);
		},
		changeCenter(state, center) {
			Vue.set(state, 'center', center);
		},
		setMessageTimer(state, messageTimer) {
			Vue.set(state, 'messageTimer', messageTimer);
		},
	},
	actions: {
		undo({state, commit, dispatch}) {
			if(state.stateBackupsIndex > 0) {
				commit('stateBackupsIndexChange', -1);
				dispatch('applyUndoRedo');
				store.commit('inUndoRedo');
				store.commit('setSaved', false);
			}
		},
		redo({state, commit, dispatch}) {
			if(state.stateBackupsIndex < state.stateBackups.length - 1) {
				commit('stateBackupsIndexChange', 1);
				dispatch('applyUndoRedo');
				if(state.stateBackupsIndex === state.stateBackups.length - 1) {
					store.commit('outUndoRedo');
					store.commit('setSaved', true);
				}
			}
		},
		applyUndoRedo({state, commit}) {
			commit('restoreState', state.stateBackupsIndex);
			bus.$emit('homeRefresh');
		},
		unload({commit}) {
			commit('reset');
			sessionStorage.removeItem('places-userid');
			sessionStorage.removeItem('places-session');
		},
		setUser({commit, dispatch}) {
			const userRequest = new XMLHttpRequest();
			userRequest.open('GET', '/backend/get_account.php?id=' + sessionStorage.getItem('places-userid'), true);
			userRequest.onreadystatechange = function() {
				if(userRequest.readyState == 4) {
					if(userRequest.status == 200) {
						const user: any = JSON.parse(userRequest.responseText);
						commit('setUser', user);
					} else {
						dispatch('setMessage', 'Не могу получить данные');
						commit('setUser', null);
					}
				}
			};
			userRequest.send(null);
		},
		setPlaces({state, commit, dispatch}, payload) {
			// If reading from database, not importing
			if(!payload) {
				const placesRequest = new XMLHttpRequest();
				placesRequest.open(
					'GET',
					'/backend/get_places.php?id=' +
						sessionStorage.getItem('places-userid'),
					true
				);
				placesRequest.onreadystatechange = function() {
					if(placesRequest.readyState == 4) {
						if(placesRequest.status == 200) {
							const all_places = JSON.parse(placesRequest.responseText);
							commonFunctions.sortObjectsByProximity(all_places[1]);
							commit('placesReady', {
								places: all_places[0],
								commonPlaces: all_places[1],
								folders: all_places[2],
							});
							commit('setHomePlace', state.user.homeplace);
							commit('foldersToTree');
							bus.$emit('placesFilled');
						} else {
							dispatch('setMessage', 'Не могу получить данные из БД');
							commit('placesReady', {
								places: [],
								commonPlaces: [],
								folders: [],
							});
						}
					}
				};
				placesRequest.send(null);
			/*
			 * If importing from file.
			 * A payload parameter is present and is an object:
			 * {text: <file’s content as a text>, type: <file’s MIME-type>}
			 */
			} else {
				let parsed: any;
				switch(payload.mime) {
					case 'application/json' :
						try {
							parsed = JSON.parse(payload.text);
							break;
						} catch(e) {
							dispatch('setMessage',
								'Ошибка при разборе импортируемого файла.'
							);
							return false;
						}
					case 'application/gpx+xml' :
						parsed = {places: [], folders: []};
						for(const folder of state.folders) {
							if(folder.id === 'imported') {
								parsed.folders[0] = folder;
								break;
							}
						}
						let dom: any = null, importedPlaceFolder: any = {};
						// Parsing XML text to a DOM tree
						if(window.DOMParser) {
							try {
								dom = (new DOMParser()).parseFromString(
									payload.text, 'text/xml'
								);
							} catch(e) {
								dispatch('setMessage',
									'Ошибка при разборе импортируемого файла.'
								);
								return false;
							}
						} else if(window.ActiveXObject) {
							try {
								dom = new ActiveXObject('Microsoft.XMLDOM');
								dom.async = false;
								if(!dom.loadXML(payload.text)) {
									dispatch('setMessage',
										dom.parseError.reason + dom.parseError.srcText
									);
								}
							} catch(e) {
								dispatch('setMessage',
									'Ошибка при разборе импортируемого файла.'
								);
								return false;
							}
						} else {
							dispatch('setMessage',
								'Ошибка при разборе импортируемого файла.'
							);
							return false;
						}
						let description: string, link: string, time: any;
						for(const wpt of dom.getElementsByTagName('wpt')) {
							// Parsing a link node(s) in a place node
							for(const l of wpt.getElementsByTagName('link')) {
								if(/^\w/.test(l.getAttribute('href').trim())) {
									link =
											/^http/.test(l.getAttribute('href').trim())
												? '' : 'http://'
											+ l.getAttribute('href').trim()
									;
									break;
								}
							}
							// Parsing a time node in a place node
							if(wpt.getElementsByTagName('time').length > 0) {
								time = new Date(
									wpt.getElementsByTagName('time')[0].textContent.trim()
								);
								time = isNaN(time) ? '' : time.toISOString().slice(0, -5);
							}
							/*
								 * Updating the tree branch of folders for imported places
								 * and get an ID of a folder for the importing place
								 */
							importedPlaceFolder = commonFunctions.formFolderForImported(
								time,
								parsed.folders[0]
							);
							parsed.folders[0] = importedPlaceFolder.imported;
							// Parsing a description node in a place node
							description = '';
							if(wpt.getElementsByTagName('desc').length > 0) {
								for(const desc of wpt.getElementsByTagName('desc')[0].childNodes) {
									try {
										switch(desc.nodeType) {
										case 1 : case 3 :
											description += desc.textContent.trim()
														+ (desc.nextSibling ? '\n' : '');
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
											for(let i = 0; i < descs.length; i++) {
												description += descs[i].replace(
													new RegExp(reStr, 'i'), "$1"
												) + (desc.nextSibling ? '\n' : '');
											}
											break;
										}
									} catch(e) {
									}
								}
							}
							// Forming an importing place as an object and pushing it in a structure
							parsed.places.push({
								id: commonFunctions.generateRandomString(32),
								folderid: importedPlaceFolder.folderid,
								name: wpt.getElementsByTagName('name').length > 0
									? wpt.getElementsByTagName('name')[0].textContent.trim()
									: '',
								description: description,
								link: link,
								latitude: parseFloat(wpt.getAttribute('lat')),
								longitude: parseFloat(wpt.getAttribute('lon')),
								altitudecapability: wpt.getElementsByTagName('ele') > 0
									? wpt.getElementsByTagName('ele')[0].textContent.trim()
									: '',
								time: time,
								srt: (parsed.places.length > 0 ? parsed.places.length + 1 : 1),
								common: 0,
								userid: sessionStorage.getItem('places-userid'),
								images: [],
								type: 'place',
								added: true,
								deleted: false,
								updated: false,
								show: true,
							});
						}
						break;
					default :
						dispatch('setMessage',
							'Недопустимый тип импортируемого файла.' +
							'Допускаются только JSON и GPX.'
						);
						return false;
				}
				try {
					commit('addImporting', {
						places: parsed.places,
						folders: parsed.folders,
					});
					bus.$emit('placesFilled', 'importing');
				} catch(e) {
					dispatch('setMessage',
						'Ошибка при попытке импорта.'
					);
					return false;
				}
				return true;
			}
		},
		moveFolder({state, commit}, payload) {
			let source: any, target: any;
			const folder = payload.hasOwnProperty('folder')
				? payload.folder
				: commonFunctions.findInTree(
					{id: 'root', children: state.folders},
					'children',
					'id',
					payload.folderId
				)
			;
			if(!folder.parent) {
				source = state.folders;
			} else {
				source = commonFunctions.findInTree(
					{id: 'root', children: state.folders},
					'children',
					'id',
					folder.parent
				).children;
			}
			if(
				!payload.targetId ||
				payload.targetId === null ||
				payload.targetId === 'root'
			) {
				target = state.folders;
			} else {
				target = commonFunctions.findInTree(
					{id: 'root', children: state.folders},
					'children',
					'id',
					payload.targetId
				);
				if(!target.children) {
					Vue.set(target, 'children', []);
				}
				target = target.children;
			}
			const srt: number = (
				payload.hasOwnProperty('srt') ? payload.srt : (
					target.length > 0 ? target[target.length - 1].srt + 1 : 1
				)
			);
			target.push(source.splice(source.indexOf(folder), 1)[0]);
			commit('changeFolder', {
				folder: folder,
				change: {
					parent: payload.targetId === 'root' ? null : payload.targetId,
					srt: srt,
					updated: true,
				},
				backup: !payload.hasOwnProperty('backup') || payload.backup ? true : false,
			});
		},
		clearMessage({state, commit}, hide) {
			let message: string;
			if(hide || (message = state.message.replace(/^\n[^<>]+\s*/, '')) === '') {
				const me = document.getElementById('message-main');
				if(me) {
					me.classList.add('invisible');
					me.classList.remove('visible');
				}
				setTimeout(function() {
					commit('setMessage', '');
				}, 500);
			} else {
				commit('setMessage', message);
			}
		},
		setMessage({state, commit, dispatch}, message) {
			const last = state.message.match(/\n([^<>]+)\s*$/);
			const me = document.getElementById('message-main');
			if(last !== null && last[1] === message) {
				if(me && me.lastElementChild) {
					me.lastElementChild.classList.add('highlight');
					setTimeout(function() {
						if(document.getElementById('message-main').lastElementChild) {
							document.getElementById('message-main').lastElementChild.classList.remove('highlight');
						}
					}, 500);
				}
			} else {
				commit('setMessage', state.message += "\n" + message);
			}
			if(me && state.message) {
				me.classList.add('visible');
				me.classList.remove('invisible');
			}
			if(state.messageTimer) {
				clearTimeout(state.messageTimer);
			}
			commit(
				'setMessageTimer',
				setTimeout(
					function messageTimeout() {
						dispatch('clearMessage');
						if(state.message) {
							commit('setMessageTimer', setTimeout(messageTimeout, 3000));
						}
					},
					3000
				)
			);
		},
	},
	getters: {
		getCurrentPlace: (state, getters) => {
			return state.currentPlace;
		},
		getMessage: (state, getters) => {
			return state.message;
		},
		getAccountDeleteMessage: (state, getters) => {
			return state.message;
		},
		getAccountChangeMessage: (state, getters) => {
			return state.message;
		},
	},
})

export default store
