import Vue from "vue"
import Vuex from "vuex"
import App from "./App.vue"
import {store} from "./store.js"
import {constants} from "./shared/constants.js"
import {bus} from "./shared/bus.js"
import {mapGetters} from "vuex"
import axios from "axios"
import './css/style.css'
import './css/layout.css'

Vue.use(Vuex);

//Vue.config.devtools = true;

let app = new Vue({
	data: {
		refreshing: false,
		popupComponent: "popuptext",
		popuped: "disappear",
		popupData: {},
		needToUpdate: false,
		needToUpdateFolders: false,
		draggingElement: null,
		folderRoot: null,
		foldersEditMode: false,
		selectedToExport: [],
	},
	mounted: function() {
		bus.$on("toDB", payload => {
			let plain = [];
			switch(payload.what) {
				case "places" :
					this.toDB("places", JSON.stringify(this.$store.state.places));
					break;
				case "folders" :
					treeToPlain(this.folderRoot, "children", plain);
					this.toDB("folders", JSON.stringify(plain));
					break;
				case undefined :
					this.toDB("places", JSON.stringify(this.$store.state.places));
					treeToPlain(this.folderRoot, "children", plain);
					this.toDB("folders", JSON.stringify(plain));
					break;
				default :
					this.toDB(payload.what, payload.data);
			}
		});
		bus.$on("homeToDB", place => {
			this.homeToDB(place);
		});
		bus.$on("toDBCompletely", () => {
			this.toDBCompletely();
		});
	},
	computed: {
		...mapGetters(["getIndexById"]),
		setCurrentPlace: (place, common = false) => function(place, common = false) {
			bus.$emit("setCurrentPlace", {place, common});
		},
		showPopup: (opts, event) => function(opts, event) {
			event.stopPropagation();
			this.$store.commit("setIdleTime", 0);
			switch(opts.type) {
				case "text" :
					this.popupData = opts.data;
					this.popupComponent = "popuptext";
					break;
				case "image" :
					this.popupData = opts.data;
					this.popupComponent = "popupimage";
					break;
				case "folder" :
					this.popupData = opts.data;
					this.popupComponent = "popupfolder";
					break;
				case "folderDelete" :
					this.popupData = opts.data;
					this.popupComponent = "popupfolderdelete";
					break;
				case "export" :
					this.popupData = opts.data;
					this.popupComponent = "popupexport";
					break;
				case "delete" :
					this.popupComponent = "popupdelete";
					break;
				default :
					this.popupComponent = null;
			}
			if(!opts["show"]) {
				this.popupComponent = null;
			}
			this.popuped = opts["show"] ? "appear" : "disappear";
		},
		showAbout: event => function(event) {
			let aboutRequest = new XMLHttpRequest();
			aboutRequest.open("GET", "/about.htm", true);
			aboutRequest.onreadystatechange = (event) => {
				if(aboutRequest.readyState == 4) {
					if(aboutRequest.status == 200) {
						this.showPopup({
							show: true,
							type: "text",
							data:
								JSON.stringify(aboutRequest.responseText)
									.replace(/^\s*\"/, "")
									.replace(/\"\s*$/, "")
									.replace(/(?:\\(?=")|\\(?=\/)|\\t|\\n)/gi, "")
							,
						}, event);
					} else {
						this.$store.dispatch("setMessage", "Не могу найти справку");
					}
				}
			};
			aboutRequest.setRequestHeader("Content-type", "application/json");
			aboutRequest.send();
		},
		toDB: (todo, data) => function(todo, data) {
			if(!this.$store.state.user.testaccount) {
				if(!document.querySelector(".value_wrong")) {
					let placesRequest = new XMLHttpRequest();
					placesRequest.open("POST", "/backend/set_places.php", true);
					placesRequest.onreadystatechange = (event) => {
						if(placesRequest.readyState == 4) {
							if(placesRequest.status == 200) {
								this.$store.commit("setSaved", true);
								this.$store.dispatch("setMessage",
									"Изменения сохранены в базе данных"
								);
							} else {
								this.$store.dispatch("setMessage",
									"Не могу внести данные в БД"
								);
							}
						}
					};
					placesRequest.setRequestHeader(
						"Content-type", "application/x-www-form-urlencoded"
					);
					placesRequest.send(
						"id=" + sessionStorage.getItem("places-userid") +
						"&todo=" + (typeof(todo) !== "undefined"
							? todo
							: "places"
						) +
						"&data=" + (typeof(data) !== "undefined"
							? data
							: JSON.stringify(this.$store.state.places)
						)
					);
				} else {
					this.$store.dispatch("setMessage",
						"Некоторые поля заполнены некорректно"
					);
				}
			}
		},
		homeToDB: (place) => function(place) {
			if(!this.$store.state.user.testaccount) {
				let homeRequest = new XMLHttpRequest();
				homeRequest.open("POST", "/backend/set_home.php", true);
				homeRequest.onreadystatechange = (event) => {
					if(homeRequest.readyState == 4) {
						if(homeRequest.status == 200) {
							this.$store.commit("setSaved", true);
							this.$store.dispatch("setMessage",
								"Изменения сохранены в базе данных"
							);
						} else {
							this.$store.dispatch("setMessage",
								"Не могу внести данные в БД"
							);
						}
					}
				};
				homeRequest.setRequestHeader(
					"Content-type", "application/x-www-form-urlencoded"
				);
				homeRequest.send(
					"id=" + sessionStorage.getItem("places-userid") +
					"&data=" + place.id
				);
			}
		},
		toDBCompletely: () => function() {
			if(!this.$store.state.user.testaccount) {
				let placesRequest = new XMLHttpRequest();
				placesRequest.open("POST", "/backend/set_completely.php", true);
				placesRequest.onreadystatechange = (event) => {
					if(placesRequest.readyState == 4) {
						if(placesRequest.status == 200) {
							this.$store.commit("setSaved", true);
							this.$store.dispatch("setMessage",
								"Изменения сохранены в базе данных"
							);
						} else {
							this.$store.dispatch("setMessage",
								"Не могу внести данные в БД"
							);
						}
					}
				};
				placesRequest.setRequestHeader(
					"Content-type", "application/x-www-form-urlencoded"
				);
				let plainFolders = [];
				treeToPlain(
					this.folderRoot,
					"children",
					plainFolders
				);
				placesRequest.send(
					"id=" + sessionStorage.getItem("places-userid") +
					"&data=" + (JSON.stringify({
						"places": this.$store.state.places,
						"folders": plainFolders,
					}))
				);
			}
		},
		deleteFiles: (inarray, files) => function(inarray, files) {
			let data = new FormData();
			let place = {};
			let indexOfImage = -1;
			if(!files) {
				files = inarray;
			}
			for(let i = 0; i < files.length; i++) {
				data.append("file_" + i, files[i].file);
				if(files[i].placeid) {
					if(files[i].placeid != place.id) {
						for(let y = 0; y < this.$store.state.places.length; y++) {
							place = this.$store.state.places[y];
							indexOfImage = place.images.indexOf(files[i]);
							break;
						}
					}
					if(indexOfImage > -1) {
						this.$store.commit("changePlace", {
							place: place,
							change: {
								images: place.images.splice(indexOfImage, 1),
								updated: true,
							},
							backup: !place.deleted,
						});
					}
					indexOfImage = -1;
				}
			}
			data.append("userid", this.$store.state.user.id);
			if(!this.$store.state.user.testaccount) {
				axios.post("/backend/delete.php", data)
					.then(response => {
						this.toDB("images_delete", JSON.stringify(files));
					}
				);
			}
		},
		exportPlaces: (places, mime) => function(places, mime) {
			let content, a = document.createElement("a");
			switch(mime) {
				case "application/gpx+xml" :
					a.download = "places.gpx";
					a.dataset.downloadurl = ["application/gpx+xml", a.download, a.href].join(":");
					content =
						'<?xml version="1.0" encoding="utf-8" standalone="yes"?>'
						+ '<gpx'
						+ ' version="1.1"'
						+ ' xmlns="http://www.topografix.com/GPX/1/1"'
						+ ' xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
						+ ' xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">'
					;
					for(let p of places) {
						content += '<wpt lat="' + p.latitude + '" lon="' + p.longitude + '">';
						content += p.name ? ('<name>' + p.name + '</name>') : '';
						content += p.description ? ('<description>' + p.description + '</description>') : '';
						content += p.link ? ('<link href="' + p.link + '"></link>') : '';
						content += p.altitudecapability ? ('<ele>' + p.altitudecapability + '</ele>') : '';
						content += p.time ? ('<time>' + p.time + '</time>') : '';
						content += '</wpt>';
					}
					content += '</gpx>';
					break;
				default :
					mime = "application/json";
					a.download = "places.json";
					a.dataset.downloadurl = ["application/json", a.download, a.href].join(":");
					content = JSON.stringify({
						places: this.$store.state.places,
						folders: this.$store.state.folders,
					});
			}
			a.href = window.URL.createObjectURL(new Blob([content], {type: "text/plain"}));
			let e = document.createEvent("MouseEvents");
			e.initEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			a.dispatchEvent(e);
		},
	},
	methods: {
		handleDragStart: function(event) {
			this.$store.commit("setIdleTime", 0);
			event.dataTransfer.setData("text/plain", null);
			this.draggingElement = event.target;
		},
		handleDragEnter: function(event) {
			event.preventDefault();
			event.stopPropagation();
			if(
				this.draggingElement !== event.target
				&& event.target.classList
			) {
				// Place button passes over sorting areas of another place button
				if(
					this.draggingElement !== event.target.parentNode
					&& this.draggingElement.classList.contains("place-button")
					&& event.target.classList.contains("place-button__dragenter-area")
					&& !(
						this.draggingElement.nextElementSibling === event.target.parentNode
						&& event.target.classList.contains("place-button__dragenter-area_top")
					)
					&& !(
						this.draggingElement.previousElementSibling === event.target.parentNode
						&& event.target.classList.contains("place-button__dragenter-area_bottom")
					)
				) {
					if(event.target.classList.contains("place-button__dragenter-area_top")) {
						event.target.classList.add("dragenter-area_top_border");
					}
					if(event.target.classList.contains("place-button__dragenter-area_bottom")) {
						event.target.classList.add("dragenter-area_bottom_border");
					}
				}
				// Folder link passes over sorting areas of another folder link
				if(
					this.draggingElement.classList.contains("folder-button")
					&& event.target.classList.contains("places-menu-folder__dragenter-area")
				) {
					if(event.target.classList.contains("places-menu-folder__dragenter-area_top")) {
						event.target.classList.add("dragenter-area_top_border");
					}
					if(event.target.classList.contains("places-menu-folder__dragenter-area_bottom")) {
						event.target.classList.add("dragenter-area_bottom_border");
					}
				}
				// Photo image passes over another photo image
				if(
					this.$store.state.currentPlace
					&& this.draggingElement.classList.contains("place-image")
					&& event.target.classList.contains("place-image")
				) {
					this.$store.commit("swapValues", {
						parent: this.$store.state.currentPlace.images,
						indexes: [
							this.getIndexById({
								parent: this.$store.state.currentPlace.images,
								id: this.draggingElement.id,
							}),
							this.getIndexById({
								parent: this.$store.state.currentPlace.images,
								id: event.target.id,
							}),
						],
						values: ["srt"],
						backup: false,
					});
					this.needToUpdate = true;
				}
			}
		},
		handleDragLeave: function(event) {
			event.preventDefault();
			if(event.target.classList) {
				// Place button leaves sorting areas of another place button
				if(event.target.classList.contains("place-button__dragenter-area")) {
					event.target.classList.remove("dragenter-area_top_border");
					event.target.classList.remove("dragenter-area_bottom_border");
				}
				// Folder link leaves sorting areas of another folder link
				if(event.target.classList.contains("places-menu-folder__dragenter-area")) {
					event.target.classList.remove("dragenter-area_top_border");
					event.target.classList.remove("dragenter-area_bottom_border");
				}
			}
		},
		handleDragOver: function(event) {
			event.preventDefault();
			// Folder link or place button pass over a folder link
			for(let f of document.getElementsByClassName("folder-button")) {
				f.classList.remove("folder-button_parent");
			}
			if(
				(
					this.draggingElement.classList.contains("folder-button")
					|| this.draggingElement.classList.contains("place-button")
				)
				&& event.target.classList.contains("folder-button")
			) {
				event.target.classList.add("folder-button_parent");
			}
		},
		handleDrop: function(event) {
			event.preventDefault();
			event.stopPropagation();
			if(
				this.draggingElement !== event.target
				&& event.target.classList
			) {
				let
					srt = null,
					targetSrt = Number(
						event.target.parentNode.getAttribute("srt")
						|| event.target.parentNode.parentNode.getAttribute("srt")
					)
				;
				// Place button dropped on folder list item
				if(
					this.draggingElement.classList.contains("place-button")
					&& event.target.parentNode.parentNode.classList.contains("places-menu-folder")
				) {
					let container;
					event.target.parentNode.parentNode.querySelectorAll(".places-menu-item")
						.forEach(function(c) {
							if(c.parentNode === event.target.parentNode.parentNode) {
								container = c;
								return;
							}
						}
					);
					if(container) {
						let srt;
						if(container.children.length > 0) {
							srt =
								this.$store.state.places[this.getIndexById({
									parent: this.$store.state.places,
									id: container.children[container.children.length - 1].id,
								})].srt + 1
							;
						} else {
							srt = 1;
						}
						this.$store.commit("changePlace", {
							place:
								this.$store.state.places[this.getIndexById({
									parent: this.$store.state.places,
									id: this.draggingElement.id,
								})]
							,
							change: {
								folderid:
									container.id === "places-menu-item-root"
										? null
										: container.id
								,
								srt: srt,
							},
							backup: false,
						});
						this.needToUpdate = true;
					}
				}
				// Place button dropped on sorting areas of another place button
				if(
					this.draggingElement !== event.target.parentNode
					&& this.draggingElement.classList.contains("place-button")
					&& event.target.classList.contains("place-button__dragenter-area")
					&& !(
						this.draggingElement.parentNode.parentNode.nextElementSibling === event.target.parentNode
						&& event.target.classList.contains("place-button__dragenter-area_top")
					)
					&& !(
						this.draggingElement.parentNode.parentNode.previousElementSibling === event.target.parentNode
						&& event.target.classList.contains("place-button__dragenter-area_bottom")
					)
				) {
					for(let e of document.getElementsByClassName("place-button__dragenter-area")) {
						e.classList.remove("dragenter-area_top_border");
						e.classList.remove("dragenter-area_bottom_border");
					}
					let
						targetPrev = event.target.parentNode.previousElementSibling,
						targetNext = event.target.parentNode.nextElementSibling
					;
					if(event.target.classList.contains("place-button__dragenter-area_top")) {
						if(!targetPrev) {
							srt = targetSrt / 2;
						} else if(targetPrev !== this.draggingElement) {
							let targetPrevSrt = Number(targetPrev.getAttribute("srt"));
							srt = (targetSrt - targetPrevSrt) / 2 + targetPrevSrt;
						}
					}
					if(event.target.classList.contains("place-button__dragenter-area_bottom")) {
						if(!targetNext) {
							srt = targetSrt + 1;
						} else if(targetNext !== this.draggingElement) {
							let targetNextSrt = Number(targetNext.getAttribute("srt"));
							srt = (targetNextSrt - targetSrt) / 2 + targetSrt;
						}
					}
					if(srt !== null) {
						this.$store.commit("changePlace", {
							place: this.$store.state.places[this.getIndexById({
								parent: this.$store.state.places,
								id: this.draggingElement.id,
							})],
							change: {
								folderid: this.$store.state.places[this.getIndexById({
									parent: this.$store.state.places,
									id: event.target.parentNode.id,
								})].folderid,
								srt: srt,
							},
							backup: false,
						});
						this.needToUpdate = true;
					}
				}
				// Folder link dropped on a folder link
				if(event.target.classList.contains("folder-button")) {
					for(let e of document.getElementsByClassName("folder-button_parent")) {
						e.classList.remove("folder-button_parent");
					}
				}
				if(event.target.classList.contains("places-menu-folder__dragenter-area")) {
					for(let e of document.getElementsByClassName("places-menu-folder__dragenter-area")) {
						e.classList.remove("dragenter-area_top_border");
						e.classList.remove("dragenter-area_bottom_border");
					}
				}
				// Folder link dropped on sorting areas of another folder link
				if(
					this.draggingElement.parentNode.parentNode !== event.target.parentNode
					&& this.draggingElement.classList.contains("folder-button")
					&& event.target.classList.contains("places-menu-folder__dragenter-area")
					&& !isParentInTree(
						{children: this.$store.state.folders},
						"children",
						this.draggingElement.id.substr(24),
						event.target.parentNode.id.substr(19)
					)
				) {
					let
						srt = null,
						targetSrt = Number(event.target.parentNode.firstElementChild.firstElementChild.getAttribute("srt")),
						targetPrev = event.target.parentNode.previousElementSibling,
						targetNext = event.target.parentNode.nextElementSibling
					;
					if(event.target.classList.contains("places-menu-folder__dragenter-area_top")) {
						if(!targetPrev) {
							srt = targetSrt / 2;
						} else if(targetPrev !== this.draggingElement.parentNode.parentNode) {
							let targetPrevSrt = Number(targetPrev.firstElementChild.firstElementChild.getAttribute("srt"));
							srt = (targetSrt - targetPrevSrt) / 2 + targetPrevSrt;
						}
					}
					if(event.target.classList.contains("places-menu-folder__dragenter-area_bottom")) {
						if(!targetNext) {
							srt = targetSrt + 1;
						} else if(targetNext !== this.draggingElement.parentNode.parentNode) {
							let targetNextSrt = Number(targetNext.firstElementChild.firstElementChild.getAttribute("srt"));
							srt = (targetNextSrt - targetSrt) / 2 + targetSrt;
						}
					}
					if(srt !== null) {
						this.$store.dispatch("moveFolder", {
							folderId: this.draggingElement.id.substr(24),
							targetId: event.target.parentNode.parentNode.parentNode.id.substr(19),
							srt: srt,
							backup: false,
						});
						this.needToUpdateFolders = true;
					}
				}
				// Folder link dropped on another folder link
				if(
					this.draggingElement.classList.contains("folder-button")
					&& event.target.classList.contains("folder-button")
					&& !this.draggingElement.parentNode.parentNode.contains(event.target.parentNode.parentNode.parentNode)
					&& !isParentInTree(
						{children: this.$store.state.folders},
						"children",
						this.draggingElement.id.substr(24),
						event.target.id.substr(24)
					)
				) {
					this.$store.dispatch("moveFolder", {
						folderId: this.draggingElement.id.substr(24),
						targetId: event.target.id.substr(24),
						backup: false,
					});
					this.needToUpdateFolders = true;
				}
			}
			this.draggingElement = null;
			if(this.needToUpdate || this.needToUpdateFolders) {
				this.$store.commit("backupState");
				if(this.$store.state.inUndoRedo) {
					bus.$emit("toDBCompletely");
				} else if(this.needToUpdate) {
					bus.$emit("toDB", "places");
					this.needToUpdate = false;
				} else if(this.needToUpdateFolders) {
					bus.$emit("toDB", "folders");
					this.needToUpdateFolders = false;
				}
			}
		},
	},
	store,
	el: "#app",
	render: h => h(App),
});
