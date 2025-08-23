<template>
	<div
		id="grid"
		ref="root"
		:class="`sbs_${sbs}`"
		:style="gridStyle"
		@mousemove="rootMouseOverTrottled"
		@touchmove="rootMouseOverTrottled"
		@mouseup="sidebarDragStop"
		@touchend="sidebarDragStop"
	>
		<div
			id="top-left"
			class="app-cell"
			:style="sidebarSize.top === 0 || sidebarSize.left === 0 ? 'display: none' : ''"
		>
			<div id="top-left__control-buttons-left" />
		</div>
		<div
			id="top-basic"
			class="app-cell"
			:style="sidebarSize.top === 0 ? 'display: none' : ''"
		>
			<div id="top-basic-content">
				<div class="brand">
					<h1 class="basiccolor margin_bottom_0">
						{{ mainStore.t.i.brand.header }} —
						<router-link to="/account">
							{{ mainStore.user ? mainStore.user.login : 'o_O' }}
						</router-link>
						<router-link
							v-if="
								!!mainStore['user'] &&
								!!mainStore.user['groups'] &&
								!!mainStore.user['groups'].find(
									g => g.parent === 'management'
								)
							"
							to="/admin"
							class="admin-link"
						>
							{{ mainStore.t.i.captions.admin }}
						</router-link>
					</h1>
					<div>{{ mainStore.t.i.brand.slogan }}</div>
				</div>
				<places-dashboard />
			</div>
			<div
				id="messages"
				class="invisible"
				@mouseover="mainStore.setMouseOverMessages(true)"
				@mouseout="mainStore.setMouseOverMessages(false)"
				@click="mainStore.clearMessages();"
			>
				<div
					v-for="(message, index) in mainStore.messages"
					:id="'message-' + index"
					:key="index"
					class="message border_1"
				>
					{{ mainStore.messages[index] }}
				</div>
			</div>
		</div>
		<div
			id="top-right"
			class="app-cell"
			:style="sidebarSize.top === 0 || sidebarSize.right === 0 ? 'display: none' : ''"
		>
			<div id="top-right__control-buttons-right" />
		</div>
		<div
			id="basic-left"
			class="app-cell"
			:style="sidebarSize.left === 0 ? 'display: none' : ''"
		>
			<div id="basic-left__control-buttons-left" />
			<form
				v-if="mainStore.rangeShow"
				action="javascript:void(0)"
				class="control-range"
				@submit="mainStore.showInRange(mainStore.range)"
			>
				<input
					id="range-input"
					ref="rangeInput"
					v-model="mainStore.range"
					type="number"
					min="0"
					max="6378136.6"
					:placeholder="mainStore.t.i.buttons.range"
					:title="mainStore.t.i.captions.range"
					class="fieldwidth_100"
				/>
				<span class="control-buttons">
					<button @click="mainStore.showInRange(mainStore.range)">
						<span>↪</span>
					</button>
					<button
						:title="mainStore.t.i.buttons.clear"
						@click="
							if (mainStore.range !== null) {
								mainStore.range = null;
								mainStore.showInRange(null);
							}
						"
					>
						<span>⊗</span>
					</button>
				</span>
			</form>
			<div class="temps margin_bottom">
				<div class="temps-controls">
					<button
						:title="mainStore.t.i.hints.addTemp"
						@click="mainStore.addTemp()"
					>
						⊕
					</button>
					<button
						:title="mainStore.t.i.hints.deleteAllTemps"
						@click="mainStore.deleteAllTemps()"
					>
						⊗
					</button>
				</div>
				<div class="temps-buttons">
					<button
						v-for="(temp, id) in mainStore.temps"
						:class="temp === mainStore.currentTemp ? 'button-pressed' : ''"
						@click="chooseWaypoint({waypoint: temp})"
					>
						<span>{{ Object.keys(mainStore.temps).indexOf(id) + 1 }}</span>
						<span
							:title="mainStore.t.i.hints.deleteTemp"
							@click="e => {
								e.stopPropagation();
								mainStore.deleteTemp(id);
							}"
						>
							⊗
						</span>
					</button>
				</div>
			</div>
			<div
				v-if="mainStore.measure.show"
				class="control-measure"
			>
				<dt>
					<span v-if="mainStore.measure.points.length > 1">
						{{ mainStore.t.i.captions.measure }}:
						<span class="imp_02">
							{{ mainStore.measure.distance.toFixed(3) }}
						</span>
						{{ mainStore.t.i.text.km }}
					</span>
					<span v-else>
						{{ mainStore.t.i.captions.measureChoose }}
						<span class="help" :title="mainStore.t.i.hints.measure" />
					</span>
				</dt>
				<dd
					v-for="(id, index) in mainStore.measure.points"
					:key="index"
					:measureitem="id"
					:draggable="true"
					class="draggable"
					@dragstart="e => handleDragStart(e, 'measure')"
					@dragenter="handleDragEnter"
					@drop="handleDrop"
				>
					<span v-if="mainStore.temps[id]">
						{{ `${mainStore.t.i.captions.measureWaypoint} ${mainStore.tempIndexById(id) + 1}` }}
					</span>
					<span v-else-if="mainStore.places[id] || mainStore.commonPlaces[id]">
						{{
							(mainStore.places[id]
								? mainStore.places[id]
								: mainStore.commonPlaces[id]
							).name
						}}
					</span>
					<span class="control-buttons">
						<button
							:title="mainStore.t.i.buttons.specify"
							:class="mainStore.measure.choosing === index ? 'button-pressed' : ''"
							@click="
								mainStore.measure.choosing =
									mainStore.measure.choosing === index
										? mainStore.measure.points.length
										: index
							"
						>
							<span>↪</span>
						</button>
						<button
							:title="mainStore.t.i.buttons.clear"
							@click="
								mainStore.measure.points.splice(index, 1);
								mainStore.measure.choosing = mainStore.measure.points.length;
							"
						>
							<span>⊗</span>
						</button>
					</span>
				</dd>
				<dd
					v-if="mainStore.measure.points.length > 0"
					class="control-measure-clearall"
				>
					<strong>
						{{ mainStore.t.i.buttons.clearAll }}
					</strong>
					<button
						:title="mainStore.t.i.buttons.clearAll"
						@click="
							mainStore.measure.points.length = 0;
							mainStore.measure.choosing = 0;
						"
					>
						<span>⊗</span>
					</button>
				</dd>
			</div>
			<div class="control-search">
				<input
					id="search-input"
					ref="searchInput"
					:placeholder="mainStore.t.i.inputs.searchPlaces"
					:title="mainStore.t.i.inputs.searchPlaces"
					@keyup="searchInputEvent"
				/>
				<span class="control-buttons">
					<button
						:title="mainStore.t.i.buttons.find"
						@click="selectPlaces(searchInput.value)"
					>
						<span>↪</span>
					</button>
					<button
						:title="mainStore.t.i.buttons.clear"
						@click="
							if (searchInput.value !== '') {
								searchInput.value = '';
								selectPlaces(searchInput.value);
							}
						"
					>
						<span>⊗</span>
					</button>
				</span>
			</div>
			<div id="places-tree">
				<div
					v-if="Object.keys(mainStore.places).length > 0 || Object.keys(mainStore.folders).length > 0"
					id="places-menu"
					class="menu"
				>
					<places-tree instanceid="placestree" />
				</div>
				<div v-if="Object.keys(mainStore.commonPlaces).length > 0 && commonPlacesShow">
					<h2 class="basiccolor">
						{{ mainStore.t.i.captions.commonPlaces }}
					</h2>
					<div class="margin_bottom">
						<div
							v-for="commonPlace in commonPlaces"
							:id="commonPlace.id"
							:key="commonPlace.id"
							:class="'place-button block_01' + (
								commonPlace === currentPlace ||
								mainStore.measure.points.includes(commonPlace.id)
									? ' active' : ''
							)"
							@click="choosePlace({place: commonPlace})"
							@contextmenu="e => {
								e.preventDefault();
								choosePlace({
									place: commonPlace,
									mode: (mainStore.mode === 'measure' ? 'measure' : 'normal'),
								});
							}"
						>
							{{ commonPlace.name }}
						</div>
					</div>
					<div class="margin_bottom">
						<a
							v-for="(page, index) in commonPlacesPagesCount"
							:key="index"
							href="javascript:void(0);"
							:class="'pseudo_button' + (index + 1 === commonPlacesPage ? ' un_imp' : '')"
							@click="commonPlacesPage = index + 1;"
						>
							{{ index + 1 }}
						</a>
					</div>
				</div>
			</div>
		</div>
		<div
			id="basic-basic"
			class="app-cell"
		>
			<div
				class="basic-on-full button"
				:title="mainStore.t.i.hints.fullscreen"
				@click="basicOnFull"
			>
				⤧
			</div>
			<component :is="maps[mainStore.activeMapIndex].component" />
		</div>
		<div
			id="basic-right"
			class="app-cell"
			:style="sidebarSize.right === 0 ? 'display: none' : ''"
		>
			<div id="basic-right__control-buttons-right" />
			<div id="place-description">
				<div v-if="currentPlace">
					<dl
						v-for="field in orderedCurrentPlaceFields"
						:key="field"
						class="place-detailed margin_bottom_0"
					>
						<dt
							v-if="field === 'link'"
							class="place-detailed__link-dt"
						>
							<a
								v-if="!linkEditing && currentPlace[field].trim()"
								:href="currentPlace[field].trim()"
								target="_blank"
							>
								{{ mainStore.placeFields[field] }}
							</a>
							<span v-else>
								{{ mainStore.placeFields[field] }}:
							</span>
						</dt>
						<dt v-else-if="field === 'images' && orderedImages.length">
							{{ mainStore.placeFields[field] }}:
						</dt>
						<div v-if="field === 'waypoint'">
							<div class="two-fields">
								<div>
									<dt>
										{{ mainStore.placeFields['latitude'] }} °
									</dt>
									<dd>
										<input
											id="detailed-latitude"
											:value="currentPlaceLat"
											type="number"
											:disabled="!!currentPlaceCommon"
											class="fieldwidth_100"
											@change="e => mainStore.changePlace({place: currentPlace, change: {latitude: (e.target as HTMLInputElement).value.trim()}})"
										/>
									</dd>
								</div>
								<div>
									<dt>
										{{ mainStore.placeFields['longitude'] }} °
									</dt>
									<dd>
										<input
											id="detailed-longitude"
											:value="currentPlaceLon"
											type="number"
											:disabled="!!currentPlaceCommon"
											class="fieldwidth_100"
											@change="e => mainStore.changePlace({place: currentPlace, change: {longitude: (e.target as HTMLInputElement).value.trim()}})"
										/>
									</dd>
								</div>
								<div class="two-fields__combined">
									<dt>
										{{ mainStore.placeFields['coordsMinSec'] }}
									</dt>
									<dd>
										<input
											id="detailed-coordinates"
											:value="currentDegMinSec"
											type="text"
											:disabled="!!currentPlaceCommon"
											class="fieldwidth_100"
											@change="e => {const coords = string2coords((e.target as HTMLInputElement).value.trim()); if (coords === null) return; mainStore.changePlace({place: currentPlace, change: {latitude: coords[0], longitude: coords[1]}});}"
										/>
									</dd>
								</div>
							</div>
							<div class="margin_bottom_1">
								<strong>{{ mainStore.placeFields['altitudecapability'] }}:</strong>
								{{ currentPlaceAltitude === null ? '?' : currentPlaceAltitude }}
							</div>
						</div>
						<dt v-else-if="field !== 'common' && field !== 'link' && field !== 'waypoint' && field !== 'images'">
							{{ mainStore.placeFields[field] }}:
						</dt>
						<dd v-if="field === 'srt' || field === 'link'">
							<input
								:id="'detailed-' + field"
								v-model.number.trim="currentPlace[field]"
								:type="field === 'srt' ? 'number' : 'text'"
								:disabled="!!currentPlaceCommon"
								class="fieldwidth_100"
								@change="mainStore.changePlace({place: currentPlace, change: {[field]: currentPlace[field]}});"
							/>
						</dd>
						<dd v-else-if="field === 'time'">
							<input
								:id="'detailed-' + field"
								v-model="currentPlace[field]"
								type="datetime-local"
								:disabled="!!currentPlaceCommon"
								class="fieldwidth_100"
								@change="mainStore.changePlace({place: currentPlace, change: {[field]: currentPlace[field]}});"
							/>
						</dd>
						<dd
							v-else-if="field === 'common'"
							class="margin_bottom"
						>
							<label>
								<input
									:id="'detailed-' + field"
									v-model="currentPlace[field]"
									type="checkbox"
									:disabled="!!currentPlaceCommon"
									@change="mainStore.changePlace({place: currentPlace, change: {[field]: currentPlace[field]}});"
								/>
								{{ mainStore.t.i.inputs.checkboxCommon }}
							</label>
						</dd>
						<dd
							v-else-if="field === 'images' && orderedImages.length"
							id="place-images"
						>
							<div class="dd-images">
								<div
									v-for="image in orderedImages"
									:id="image.id"
									:key="image.id"
									data-image
									:class="'place-image' + (currentPlaceCommon ? '' : ' draggable')"
									:draggable="currentPlaceCommon ? false : true"
									@click="router.push({name: 'PlacesHomeImages', params: {imageId: image.id}}).catch(e => {console.error(e);})"
									@dragstart="e => handleDragStart(e, 'images')"
									@dragenter="handleDragEnter"
									@drop="handleDrop"
								>
									<div
										class="block_02"
									>
										<img
											class="image-thumbnail border_1"
											:draggable="false"
											:src="constants.dirs.uploads.images.small + image.file"
											:alt="currentPlace.name"
											:title="currentPlace.name"
										/>
										<div
											v-if="!currentPlaceCommon"
											class="dd-images__delete button"
											:draggable="false"
											@click="e => {
												e.stopPropagation();
												confirm(deleteImages, [{[image.id]: image}]);
											}"
										>
											×
										</div>
									</div>
								</div>
							</div>
						</dd>
						<dd v-else-if="field !== 'waypoint' && field !== 'images'">
							<textarea
								:id="'detailed-' + field"
								v-model.trim="currentPlace[field]"
								:disabled="!!currentPlaceCommon"
								:placeholder="field === 'name' ? mainStore.t.i.inputs.placeName : (field === 'description' ? mainStore.t.i.inputs.placeDescription : '')"
								class="fieldwidth_100"
								@change="mainStore.changePlace({place: currentPlace, change: {[field]: currentPlace[field]}});"
							/>
						</dd>
					</dl>
				</div>
				<div
					v-if="currentPlace && !currentPlace.deleted && !currentPlaceCommon"
					class="images-add margin_bottom"
				>
					<div class="images-add__div button">
						<span>{{ mainStore.t.i.buttons.addPhotos }}</span>
						<input
							id="images-add__input"
							ref="inputUploadFiles"
							type="file"
							name="files"
							multiple
							class="images-add__input"
							@change="e => uploadFiles(e)"
						/>
					</div>
				</div>
				<div
					id="images-uploading"
					class="block_02 waiting hidden"
				>
					<span>… {{ mainStore.t.i.buttons.loading }} …</span>
				</div>
				<div v-if="currentPlace && !currentPlaceCommon">
					<label>
						<input
							id="checkbox-homeplace"
							type="checkbox"
							:checked="currentPlace === mainStore.homePlace"
							@change="e => {
								mainStore.backupState();
								mainStore.setHomePlace({
									id: (e.target as HTMLInputElement).checked
										? currentPlace.id
										: null
								});
							}"
						/>
						{{ mainStore.t.i.inputs.checkboxHome }}
					</label>
				</div>
				<div>
					<button
						:disabled="mainStore.saved"
						:title="(!mainStore.saved ? (mainStore.t.i.hints.notSaved + '. ') : '') + mainStore.t.i.hints.sabeToDb"
						class="save-button"
						@click="toDBCompletely"
					>
						{{ mainStore.t.i.buttons.save }}
					</button>
				</div>
			</div>
		</div>
		<div
			id="bottom-left"
			class="app-cell"
			:style="sidebarSize.bottom === 0 || sidebarSize.left === 0 ? 'display: none' : ''"
		>
			<div class="control-buttons">
				<button
					id="placemarksShowHideButton"
					:class="'actions-button' + (mainStore.placemarksShow ? ' button-pressed' : '')"
					:title="mainStore.t.i.hints.shPlacemarks"
					@click="mainStore.placemarksShowHide()"
				>
					<span>◆</span>
					<span>{{ mainStore.t.i.buttons.places }}</span>
				</button>
				<button
					id="commonPlacesShowHideButton"
					:class="'actions-button' + (commonPlacesShow ? ' button-pressed' : '')"
					:title="mainStore.t.i.hints.shCommonPlaces"
					@click="commonPlacesShowHide();"
				>
					<span>◇</span>
					<span>{{ mainStore.t.i.buttons.commonPlaces }}</span>
				</button>
				<button
					id="commonPlacemarksShowHideButton"
					:class="'actions-button' + (mainStore.commonPlacemarksShow ? ' button-pressed' : '')"
					:title="mainStore.t.i.hints.shCommonPlacemarks"
					@click="mainStore.commonPlacemarksShowHide()"
				>
					<span>⬙</span>
					<span>{{ mainStore.t.i.buttons.commonPlacemarks }}</span>
				</button>
				<button
					id="centerPlacemarkShowHideButton"
					:class="'actions-button' + (mainStore.centerPlacemarkShow ? ' button-pressed' : '')"
					:title="mainStore.t.i.hints.shCenter"
					@click="mainStore.centerPlacemarkShowHide()"
				>
					<span>◈</span>
					<span>{{ mainStore.t.i.buttons.center }}</span>
				</button>
			</div>
		</div>
		<div
			id="bottom-basic"
			class="app-cell"
			:style="sidebarSize.bottom === 0 ? 'display: none' : ''"
		>
			<div class="choose-map">
				<select
					id="choose-map-input"
					:title="mainStore.t.i.hints.mapProvider"
					@change="e => mainStore.activeMapIndex = (e.target as HTMLSelectElement).selectedIndex"
				>
					<option
						v-for="(map, index) in maps"
						:key="index"
						:value="map.componentName"
						:selected="map.componentName === maps[mainStore.activeMapIndex].componentName"
					>
						{{ map.name }}
					</option>
				</select>
			</div>
			<div class="center-coordinates">
				<span class="imp">
					{{ mainStore.t.i.captions.center }}:
				</span>
				<span
					class="nobr"
					style="margin-left: 1em;"
				>
					<input
						id="center-coordinates-latitude"
						v-model.number.trim="mainStore.center.latitude"
						placeholder="latitude"
						title="mainStore.t.i.captions.latitude"
					/>
					°N
				</span>
				<span
					class="nobr"
					style="margin-left: 1em;"
				>
					<input
						id="center-coordinates-longitude"
						v-model.number.trim="mainStore.center.longitude"
						placeholder="longitude"
						title="mainStore.t.i.captions.longitude"
					/>
					°E
				</span>
				<span
					class="nobr"
					style="margin-left: 1em;"
				>
					{{ mainStore.t.i.captions.altitude }}:
					{{ centerAltitude }}
				</span>
			</div>
		</div>
		<router-view />
		<places-popup-confirm
			v-if="confirmPopup"
			:callback="confirmCallback"
			:arguments="confirmCallbackArgs"
			:message="confirmMessage"
		/>
		<div
			id="sbs-top"
			:style="`
				top: ${sidebarSize.top - 11}px;
				left: ${compactControlButtons ? sidebarSize.left : 0}px;
				right: ${compactControlButtons ? sidebarSize.right : 0}px;
			`"
			@mousedown="e => sidebarDragStart(e, 'top')"
			@touchstart="e => sidebarDragStart(e, 'top')"
		/>
		<div
			id="sbs-right"
			:style="`right: ${sidebarSize.right - 11}px`"
			@mousedown="e => sidebarDragStart(e, 'right')"
			@touchstart="e => sidebarDragStart(e, 'right')"
		/>
		<div
			id="sbs-bottom"
			:style="`bottom: ${sidebarSize.bottom - 11}px`"
			@mousedown="e => sidebarDragStart(e, 'bottom')"
			@touchstart="e => sidebarDragStart(e, 'bottom')"
		/>
		<div
			id="sbs-left"
			:style="`left: ${sidebarSize.left - 11}px`"
			@mousedown="e => sidebarDragStart(e, 'left')"
			@touchstart="e => sidebarDragStart(e, 'left')"
		/>
	</div>
	<Teleport :to="compactControlButtons
		? '#basic-left__control-buttons-left'
		: '#top-left__control-buttons-left'
	">
		<div class="control-buttons">
			<button
				id="actions-append"
				class="actions-button"
				:title="mainStore.t.i.hints.addPlace"
				accesskey="a"
				@click="appendPlace();"
			>
				<span>⊕</span>
				<span>{{ mainStore.t.i.buttons.newPlace }}</span>
			</button>
			<button
				id="actions-delete"
				class="actions-button"
				:title="mainStore.t.i.hints.deletePlace"
				:disabled="!(mainStore.user && currentPlace && currentPlace.userid === mainStore.user.id)"
				accesskey="d"
				@click="mainStore.deletePlaces({places: {[currentPlace.id]: currentPlace}});"
			>
				<span>⊗</span>
				<span>{{ mainStore.t.i.buttons.delete }}</span>
			</button>
			<button
				id="actions-append-folder"
				class="actions-button"
				:title="mainStore.t.i.hints.addFolder"
				accesskey="f"
				@click="router.push({name: 'PlacesHomeFolder'}).catch(e => {console.error(e);});"
			>
				<span>⊕</span>
				<span>{{ mainStore.t.i.buttons.newFolder }}</span>
			</button>
			<button
				id="actions-edit-folders"
				:class="'actions-button' + (foldersEditMode ? ' button-pressed' : '')"
				:title="mainStore.t.i.hints.editFolders"
				accesskey="c"
				@click="foldersEditMode = !foldersEditMode;"
			>
				<span>🖉</span>
				<span>{{ mainStore.t.i.buttons.editFolders }}</span>
			</button>
			<button
				id="actions-range"
				:class="'actions-button' + (mainStore.rangeShow ? ' button-pressed' : '')"
				:title="mainStore.t.i.captions.range"
				accesskey="r"
				@click="e => {
					mainStore.rangeShow = !mainStore.rangeShow;
					mainStore.rangeShow
					? mainStore.showInRange(mainStore.range)
					: mainStore.showInRange(null)
				}"
			>
				<span>⊘</span>
				<span>{{ mainStore.t.i.buttons.range }}</span>
			</button>
			<button
				id="actions-measure"
				:class="'actions-button' + (mainStore.measure.show ? ' button-pressed' : '')"
				:title="mainStore.t.i.captions.measure"
				accesskey="m"
				@click="e => {
					mainStore.measure.show = !mainStore.measure.show;
					mainStore.mode = mainStore.measure.show ? 'measure' : 'normal';
				}"
			>
				<span>123</span>
				<span>{{ mainStore.t.i.buttons.measure }}</span>
			</button>
		</div>
	</Teleport>
	<Teleport :to="compactControlButtons
		? '#basic-right__control-buttons-right'
		: '#top-right__control-buttons-right'
	">
		<div class="control-buttons">
			<input
				id="import-from-file-input"
				ref="importFromFileInput"
				name="jsonFile"
				type="file"
				accept=".json,.gpx,text/xml,application/json"
				@change="importFromFile();"
			/>
			<button
				id="actions-undo"
				:disabled="mainStore.stateBackupsIndex < 1 && !mainStore.backup"
				class="actions-button"
				:title="mainStore.t.i.hints.undo"
				accesskey="z"
				@click="mainStore.undo();"
			>
				<span>↺</span>
				<span>{{ mainStore.t.i.buttons.undo }}</span>
			</button>
			<button
				id="actions-redo"
				:disabled="
					!mainStore.stateBackups ||
					mainStore.stateBackupsIndex === mainStore.stateBackups.length - 1
				"
				class="actions-button"
				:title="mainStore.t.i.hints.redo"
				accesskey="y"
				@click="mainStore.redo();"
			>
				<span>↻</span>
				<span>{{ mainStore.t.i.buttons.redo }}</span>
			</button>
			<button
				id="actions-save"
				:disabled="mainStore.saved || mainStore.user.testaccount"
				:class="'actions-button' + (!mainStore.saved ? ' button-pressed' : '')"
				:title="(!mainStore.saved ? (mainStore.t.i.hints.notSaved + '. ') : '') + mainStore.t.i.hints.sabeToDb"
				accesskey="s"
				@click="toDBCompletely"
			>
				<span>↸</span>
				<span>{{ mainStore.t.i.buttons.save }}</span>
			</button>
			<button
				id="actions-install"
				class="actions-button"
				:title="mainStore.t.i.hints.install"
				:disabled="installButtonEnabled"
				@click="installPWA()"
			>
				<span>⤓</span>
				<span>{{ mainStore.t.i.buttons.install }}</span>
			</button>
			<button
				id="actions-import"
				class="actions-button"
				:title="mainStore.t.i.hints.importPlaces"
				accesskey="i"
				@click="importFromFileInput.click()"
			>
				<span>↲</span>
				<span>{{ mainStore.t.i.buttons.import }}</span>
			</button>
			<button
				id="actions-export"
				class="actions-button"
				:title="mainStore.t.i.hints.exportPlaces"
				accesskey="e"
				@click="router.push({name: 'PlacesHomeExport'})"
			>
				<span>↱</span>
				<span>{{ mainStore.t.i.buttons.export }}</span>
			</button>
			<button
				id="actions-about"
				class="actions-button"
				:title="mainStore.t.i.hints.about"
				accesskey="h"
				@click="
					router.push({
						name: 'PlacesHomeText',
						params: {what: 'about'}
					});
				"
			>
				<span>?</span>
				<span>{{ mainStore.t.i.buttons.help }}</span>
			</button>
			<button
				id="actions-exit"
				class="actions-button"
				:title="mainStore.t.i.hints.exit"
				accesskey="q"
				@click="exit()"
			>
				<span>↪</span>
				<span>{{ mainStore.t.i.buttons.exit }}</span>
			</button>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import {
	ref, Ref,
	computed,
	watch,
	onMounted,
	onUnmounted,
	onUpdated,
	provide,
	inject,
	nextTick,
	defineAsyncComponent,
	watchEffect,
} from 'vue';
import axios from 'axios';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { orderBy, throttle } from 'lodash';
import { constants } from '@/shared/constants';
import {
	generateRandomString,
	sortObjects,
	coords2string,
	string2coords,
} from '@/shared/common';
import { makeFieldsValidatable } from '@/shared/fields_validate';
import { emitter } from '@/shared/bus';
import PlacesDashboard from './PlacesDashboard.vue';
import PlacesTree from './PlacesTree.vue';
import PlacesPopupConfirm from './PlacesPopupConfirm.vue';
import { Waypoint, Place, Image } from '@/stores/types';

const mainStore = useMainStore();
const router = useRouter();

const idleTimeInterval = inject('idleTimeInterval') as Ref<number | undefined>;
const currentPlaceCommon = inject('currentPlaceCommon') as Ref<boolean>;
const foldersEditMode = inject('foldersEditMode') as Ref<boolean>;
const toDB = inject('toDB') as (...args: any[]) => any;
const toDBCompletely = inject('toDBCompletely') as (...args: any[]) => any;
const deleteImages = inject('deleteImages') as (...args: any[]) => any;
const handleDragStart = inject('handleDragStart') as (...args: any[]) => any;
const handleDragEnter = inject('handleDragEnter') as (...args: any[]) => any;
const handleDragOver = inject('handleDragOver') as (...args: any[]) => any;
const handleDrop = inject('handleDrop') as (...args: any[]) => any;

const maps = [
	{
		name: 'OpenStreetMap',
		component: defineAsyncComponent(() => import('./PlacesMapOpenStreetMap.vue')),
		componentName: 'PlacesMapOpenStreetMap',
	}, {
		name: 'Яндекс.Карты',
		component: defineAsyncComponent(() => import('./PlacesMapYandex.vue')),
		componentName: 'PlacesMapYandex',
	}
];
const root = ref<HTMLElement | null>(null);
const basicOnFull = () => {
	root.value?.classList.toggle('basic-fulled');
};
const extmap = ref(null);
provide('extmap', extmap);
const importFromFileInput = ref<HTMLInputElement | null>(null);
const inputUploadFiles = ref<HTMLInputElement | null>(null);
const commonPlacesPage = ref(1);
provide('commonPlacesPage', commonPlacesPage);
const commonPlacesPagesCount = ref(0);
const commonPlacesOnPageCount = ref(constants.commonplacesonpagecount);
provide('commonPlacesOnPageCount', commonPlacesOnPageCount);
const commonPlacesShow = ref(false);

const sidebarSize = ref({
	top: constants.sidebars.top,
	right: constants.sidebars.right,
	bottom: constants.sidebars.bottom,
	left: constants.sidebars.left,
});
const gridStyle = computed(() =>
	`grid-template-rows:${sidebarSize.value.top}px 1fr ${sidebarSize.value.bottom}px;` +
	`grid-template-columns:${sidebarSize.value.left}px 1fr ${sidebarSize.value.right}px;`
);
const compact = ref(0);
const compactControlButtons = ref(false);
const sidebarDrag = ref({ what: null as unknown, x: 0, y: 0, w: 0, h: 0 });
const sbs = ref('all');

watch(compact, () => {
	const sidebars =
		compact.value === 0
			? constants.sidebars
			: compact.value === 1
				? constants.sidebarsCompact
				: constants.sidebarsCompactUltra;
	Object.assign(sidebarSize.value, sidebars);
});
const linkEditing = ref(false);
const orderedCurrentPlaceFields = ref([
	'name', 'description', 'waypoint', 'link', 'time', 'srt', 'common', 'images',
]);
const currentPlace = computed(() => mainStore.currentPlace);
const waypoints = computed(() => mainStore.waypoints);
const commonPlaces = computed<Record<string, Place>>(() => {
	const ids = Object.keys(mainStore.commonPlaces);
	const start = commonPlacesOnPageCount.value * (commonPlacesPage.value - 1);
	const end = commonPlacesOnPageCount.value * commonPlacesPage.value;
	return ids.slice(start, end).reduce((acc, id) => {
		acc[id] = mainStore.commonPlaces[id];
		return acc;
	}, {} as Record<string, Place>);
});
const orderedImages = computed<Array<Image>>(() =>
	currentPlace.value ? orderBy(currentPlace.value.images, 'srt') : []
);
const currentPlaceLat = computed<number | null>(() => {
	const cp = currentPlace.value;
	return cp ? waypoints.value[cp.waypoint]?.latitude ?? null : null;
});
const currentPlaceLon = computed<number | null>(() => {
	const cp = currentPlace.value;
	return cp ? waypoints.value[cp.waypoint]?.longitude ?? null : null;
});
const currentDegMinSec = computed(() =>
	coords2string([currentPlaceLat.value, currentPlaceLon.value])
);
const currentPlaceAltitude = ref<number | null>(null);
const centerAltitude = ref<number | null>(null);
const getAltitude = async (lat: number, lon: number, alt: Ref<number | null>) => {
	try {
		const { data } = await axios.get(
			`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`
		);
		alt.value = isNaN(Number(data.elevation)) ? null : Number(data.elevation);
	} catch {
		alt.value = null;
	}
};
watch(() => mainStore.ready, () => {
	stateReadyChanged();
});
watchEffect(() => {
	if (
		typeof currentPlaceLat.value === 'number' &&
		typeof currentPlaceLon.value === 'number'
	) {
		getAltitude(currentPlaceLat.value, currentPlaceLon.value, currentPlaceAltitude);
	}
});
watchEffect(() => {
	if (
		typeof mainStore.center.latitude === 'number' &&
		typeof mainStore.center.longitude === 'number'
	) {
		getAltitude(mainStore.center.latitude, mainStore.center.longitude, centerAltitude);
	}
});
watch(mainStore, changedStore => {
	if (!changedStore.refreshing) {
		sessionStorage.setItem('places-store-state', JSON.stringify(changedStore.$state));
	}
});
watch(() => mainStore.measure.points, mainStore.measureDistance, { deep: true });
watch(() => mainStore.waypoints, mainStore.measureDistance, { deep: true });
watch(() => mainStore.temps, mainStore.measureDistance, { deep: true });

emitter.on('choosePlace', (payload: {place: Place, mode?: string}) => {
	choosePlace(payload);
});
emitter.on('chooseWaypoint', (payload: {waypoint: Waypoint, mode?: string}) => {
	chooseWaypoint(payload);
});
emitter.on('deletePlace', (place: Place) => {
	deletePlace(place);
});

const confirmPopup = ref(false);
const confirmCallback = ref<Function | null>(null);
const confirmCallbackArgs = ref<any[] | null>(null);
const confirmMessage = ref<string | null>(null);
provide('confirmPopup', confirmPopup);

const confirm = (func: Function, args: any[] = [], msg: string = ''): boolean => {
	confirmPopup.value = true;
	confirmCallback.value = func;
	confirmCallbackArgs.value = args;
	confirmMessage.value = msg;
	return true;
};
onMounted(async () => {
	if (mainStore.ready) stateReadyChanged();
	mainStore.idleTime = 0;
	if (!idleTimeInterval.value) {
		idleTimeInterval.value = window.setInterval(() => {
			if (++mainStore.idleTime >= constants.sessionlifetime) {
				window.clearInterval(idleTimeInterval.value);
				idleTimeInterval.value = undefined;
				mainStore.unload();
				router.push({ name: 'PlacesAuth' });
			}
		}, 1000);
	}
	await nextTick();
	makeFieldsValidatable(mainStore.t);
	getAltitude(currentPlaceLat.value, currentPlaceLon.value, currentPlaceAltitude);
});
onUnmounted(() => {
	['dragover', 'drop', 'keyup'].forEach(event =>
		document.removeEventListener(event, {
			dragover: handleDragOver,
			drop: handleDrop,
			keyup: keyup
		}[event] as EventListener)
	);
	window.removeEventListener('resize', windowResize);
	window.clearInterval(idleTimeInterval.value);
	emitter.off('choosePlace');
	emitter.off('chooseWaypoint');
});
onUpdated(() => makeFieldsValidatable(mainStore.t));

const installEvent = inject<typeof installEvent>('installEvent');
const installButtonEnabled = computed(() => !!installEvent.value);

const installPWA = () => {
	const event = installEvent.value;
	if (!event) return;
	event.prompt();
};
const blur = (el?: HTMLElement): void => {
	if (el) (el as HTMLElement).blur();
		else document.querySelectorAll<HTMLElement>(':focus').forEach(el => el.blur());
};
const exit = (): void => {
	const getOut = () => {
		mainStore.unload();
		router.push({ name: 'PlacesAuth' });
	};
	mainStore.saved
		? getOut()
		: confirm(getOut, [], mainStore.t.i.text.notSaved);
};
const stateReadyChanged = (): void => {
	if (!mainStore.ready) return;
	mainStore.restoreObjectsAsLinks();
	if (!currentPlace.value) mainStore.setFirstCurrentPlace();
	openTreeToCurrentPlace();
	const commonPlacesKeys = Object.keys(mainStore.commonPlaces);
	const commonPlacesLen = commonPlacesKeys.length;
	const perPage = commonPlacesOnPageCount.value;
	commonPlacesPagesCount.value = Math.ceil(commonPlacesLen / perPage);
	currentPlaceCommon.value = false;
	const cp = currentPlace.value;
	if (cp && cp.common && cp.userid !== mainStore.user.id) {
		const idx = commonPlacesKeys.indexOf(cp.id);
		const inPaginator = idx / perPage;
		commonPlacesPage.value = Number.isInteger(inPaginator)
			? inPaginator + 1
			: Math.ceil(inPaginator);
		currentPlaceCommon.value = true;
	}
	// Register event listeners only once
	document.addEventListener('dragover', handleDragOver, false);
	document.addEventListener('drop', handleDrop, false);
	document.addEventListener('keyup', keyup, false);
	window.addEventListener('resize', windowResize, false);
	if (mainStore.user.testaccount) {
		setTimeout(() => {
			mainStore.setMessage(mainStore.t.m.popup.testAccount);
		}, 3000);
	}
	windowResize();
};
const openTreeToCurrentPlace = (): void => {
	if (currentPlaceCommon.value || !currentPlace.value) return;
	let folderid = currentPlace.value.folderid;
	while (folderid) {
		const folder = mainStore.treeFlat[folderid];
		if (!folder) break;
		mainStore.folderOpenClose({ folder, opened: true });
		folderid = folder.parent;
	}
};
const choosePlace = (payload: {place: Place, mode?: string}): void => {
	if (!payload.place) {
		mainStore.currentPlace = null;
		return;
	}
	switch (mainStore.mode) {
		case 'measure':
			if (payload.mode && payload.mode === 'measure') {
				const { points, choosing } = mainStore.measure;
				const placeId = payload.place.id;
				const idx = points.indexOf(placeId);
				if (idx === -1)  points[choosing] = placeId; else points.splice(idx, 1);
				mainStore.measure.choosing = points.length;
			}
		default:
			if (payload.mode === 'measure') break;
			if (mainStore.currentPlace !== payload.place) {
				mainStore.currentPlace = payload.place;
				currentPlaceCommon.value = mainStore.currentPlace.userid !== mainStore.user.id;
				openTreeToCurrentPlace();
			}
	}
};
const chooseWaypoint = (payload: {waypoint: Waypoint, mode?: string}): void => {
	switch (mainStore.mode) {
		case 'measure':
			if (payload.mode && payload.mode === 'measure') {
				const { points, choosing } = mainStore.measure;
				const waypointId = payload.waypoint.id;
				const idx = points.indexOf(waypointId);
				if (idx === -1)  points[choosing] = waypointId; else points.splice(idx, 1);
				mainStore.measure.choosing = points.length;
			}
		default:
			if (payload.mode === 'measure') break;
			if (mainStore.currentTemp !== payload.waypoint) {
				mainStore.currentTemp = payload.waypoint;
			}
		}
};
const appendPlace = async (): Promise<void | Place> => {
	const { places, serverConfig, user, center, t, addPlace, addWaypoint, setMessage } = mainStore;
	const placesCount = Object.keys(places).length;
	const maxPlaces = serverConfig.rights.placescount;
	// Check place limit
	if (!user.testaccount && maxPlaces > 0 && maxPlaces <= placesCount) {
		setMessage(t.m.popup.placesCountExceeded);
		return;
	}
	const now = new Date().toISOString().slice(0, -5);
	const waypointId = generateRandomString(32);
	const placeId = generateRandomString(32);
	const newWaypoint: Waypoint = {
		id: waypointId,
		latitude: center.latitude ?? null,
		longitude: center.longitude ?? null,
		time: now,
		common: false,
		type: 'waypoint',
		added: true,
		deleted: false,
		updated: false,
		show: true,
	};
	let folderid = 'root';
	if (currentPlace.value && !currentPlace.value.common) {
		folderid = currentPlace.value.folderid;
	}
	let srt = 1;
	if (placesCount > 0) {
		const maxSrt = Math.max(...Object.values(places).map((p: Place) => p.srt || 0));
		srt = Math.ceil(maxSrt) + 1;
	}
	const newPlace: Place = {
		type: 'place',
		userid: sessionStorage.getItem('places-userid'),
		name: '',
		description: '',
		waypoint: waypointId,
		link: '',
		time: now,
		id: placeId,
		folderid,
		srt,
		common: false,
		geomark: true,
		images: {},
		added: true,
		deleted: false,
		updated: false,
		show: true,
	};
	await addPlace({ place: newPlace });
	addWaypoint({ waypoint: newWaypoint, from: newPlace });
	choosePlace({ place: newPlace });
	await nextTick();
	const detailedNameElem = document.getElementById('detailed-name');
	if (detailedNameElem) {
		detailedNameElem.classList.add('highlight');
		window.setTimeout(() => {
			detailedNameElem.classList.remove('highlight');
			detailedNameElem.focus();
		}, 500);
	}
	return newPlace;
};
const deletePlace = (place: Place): void => {
	if (place !== currentPlace.value) return;
	const placesKeys = Object.keys(mainStore.places);
	const placesCount = placesKeys.length;
	if (placesCount <= 1) {
		choosePlace(null);
		return;
	}
	const placeElem = document.getElementById(place.id);
	if (placeElem) {
		const nextElem = placeElem.nextElementSibling as HTMLElement | null;
		const prevElem = placeElem.previousElementSibling as HTMLElement | null;
		if (nextElem && mainStore.places[nextElem.id]) {
			choosePlace({ place: mainStore.places[nextElem.id] });
			return;
		}
		if (prevElem && mainStore.places[prevElem.id]) {
			choosePlace({ place: mainStore.places[prevElem.id] });
			return;
		}
	}
	if (mainStore.homePlace && mainStore.homePlace !== place) {
		choosePlace({ place: mainStore.homePlace });
		return;
	}
	// Find the first place in the root with the minimum srt
	let firstPlaceInRoot: Place | null = null;
	for (const id of placesKeys) {
		const p = mainStore.places[id];
		if (p.folderid === 'root') {
			if (!firstPlaceInRoot || p.srt < firstPlaceInRoot.srt) {
				firstPlaceInRoot = p;
			}
		}
	}
	if (firstPlaceInRoot) {
		choosePlace({ place: firstPlaceInRoot });
	} else {
		choosePlace({ place: mainStore.places[placesKeys[0]] });
	}
};
const commonPlacesShowHide = (show = null): void => {
	commonPlacesShow.value =
		show === null
			? !commonPlacesShow.value
			: show
	;
	mainStore.commonPlacemarksShowHide(commonPlacesShow.value);
};
provide('commonPlacesShowHide', commonPlacesShowHide);

const importFromFile = (): void => {
	const input = importFromFileInput.value as HTMLInputElement;
	const file = input.files && input.files[0];
	if (!file) return;
	const mime = file.type;
	if (mime !== 'application/json' && mime !== 'application/gpx+xml') {
		mainStore.setMessage(mainStore.t.m.popup.invalidImportFileType);
		return;
	}
	const reader = new FileReader();
	reader.onload = async (event: ProgressEvent<FileReader>) => {
		await nextTick();
		mainStore.setPlaces({
			text: event.target?.result,
			mime,
		});
		input.value = '';
	};
	reader.readAsText(file);
};
const uploadFiles = (event: Event): void => {
	event.preventDefault();
	if (mainStore.user.testaccount) {
		mainStore.setMessage(mainStore.t.m.popup.taNotAllowFileUploads);
		return;
	}
	const files = (inputUploadFiles.value as HTMLInputElement).files;
	if (!files || files.length === 0) return;
	const data = new FormData();
	const filesArray: Array<Image> = [];
	let srt = 0;
	if (currentPlace.value.images && Object.keys(currentPlace.value.images).length) {
		const storeImages = Object.values(currentPlace.value.images);
		const lastImage = sortObjects(storeImages, 'srt').pop();
		srt = lastImage ? Number(lastImage.srt) || 0 : 0;
	}
	const mimes = mainStore.serverConfig.mimes;
	const uploadSize = mainStore.serverConfig.uploadsize;
	const popup = mainStore.t.m.popup;
	const placeId = currentPlace.value.id || null;
	// Validating files and creating an array for uploading
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const mimeType = file.type;
		const fileName = file.name;
		const fileSize = file.size;
		if (!mimes[mimeType]) {
			mainStore.setMessage(`${popup.file} ${fileName} ${popup.fileNotImage}`);
			continue;
		}
		if (fileSize > uploadSize) {
			mainStore.setMessage(`${popup.file} ${fileName} ${popup.fileTooLarge}`);
			continue;
		}
		const rndname = generateRandomString(32);
		data.append(rndname, file);
		filesArray.push({
			id: rndname,
			file: `${rndname}.${mimes[mimeType]}`,
			size: Number(fileSize) || null,
			type: mimeType,
			lastmodified: Number(file.lastModified) || null,
			srt: ++srt,
			placeid: placeId,
		});
	}
	if (!filesArray.length) return;
	const imagesUploading = document.getElementById('images-uploading');
	const imagesAddInput = document.getElementById('images-add__input') as HTMLInputElement;
	if (imagesUploading) imagesUploading.classList.remove('hidden');
	data.append('userid', mainStore.user.id);
	axios.post('/backend/upload.php', data)
		.then(response => {
			if (imagesAddInput) imagesAddInput.value = '';
			if (imagesUploading) imagesUploading.classList.add('hidden');
			const [errorCodes, uploadedFiles] = response.data;
			// Remove from the array those files that were not downloaded
			const uploadedIds = new Set(uploadedFiles.map((f: any) => f.id));
			for (let i = filesArray.length - 1; i >= 0; i--) {
				if (!uploadedIds.has(filesArray[i].id)) {
					filesArray.splice(i, 1);
				}
			}
			// Errors handling
			errorCodes.forEach((code: number) => {
				switch (code) {
					case 2:
						mainStore.setMessage(popup.taNotAllowFileUploads);
						break;
					case 3:
						mainStore.setMessage(popup.filesNotImages);
						break;
					case 4:
						mainStore.setMessage(
							`${popup.filesTooLarge} ${(
								(mainStore.serverConfig.rights.photosize / 1048576).toFixed(3)
							) || 0} Mb.`
						);
						break;
				}
			});
			if (uploadedFiles.length > 0 && currentPlace.value) {
				const newImagesObject: Record<string, Image> = {
					...(currentPlace.value.images || {})
				};
				for (const image of filesArray) {
					newImagesObject[image.id] = image;
				}
				mainStore.changePlace({
					place: currentPlace.value,
					change: { images: newImagesObject },
				}).then(() => {
					toDB({
						what: 'places',
						data: [currentPlace.value],
					});
				});
				toDB({
					what: 'images_upload',
					data: filesArray,
				});
				mainStore.setMessage(popup.filesUploadedSuccessfully);
			}
		})
		.catch(error => {
			mainStore.setMessage(`${mainStore.t.m.popup.filesUploadError} ${error}`);
			if (imagesAddInput) imagesAddInput.value = '';
			if (imagesUploading) imagesUploading.classList.add('hidden');
		});
};
const keyup = (event: Event): void => {
	const e = event as KeyboardEvent;
	e.preventDefault();
	if (!(e.altKey && e.shiftKey)) return;
	const shortcut = (constants.shortcuts as Record<string, string>)[e.code];
	if (!shortcut) return;
	blur();
	const actions: Record<string, () => void> = {
		'add': appendPlace,
		'delete': () => {
			if (currentPlace.value && currentPlace.value.userid === mainStore.user.id) {
				mainStore.deletePlaces({
					places: { [currentPlace.value.id]: currentPlace.value }
				});
			}
		},
		'add folder': () => router.push({ name: 'PlacesHomeFolder' }),
		'edit mode': () => {
			foldersEditMode.value = !foldersEditMode.value;
			const el = document.getElementById('actions-edit-folders');
			if (el) el.classList.toggle('button-pressed');
		},
		'import': () => importFromFileInput.value.click(),
		'export': () => router.push({ name: 'PlacesHomeExport' }),
		'save': toDBCompletely,
		'help': () => router.push({ name: 'PlacesHomeText', params: { what: 'about' } }),
		'revert': () => document.location.reload(),
		'quit': exit,
		'other': commonPlacesShowHide,
		'placemarks': () => mainStore.placemarksShowHide(),
		'other placemarks': () => mainStore.commonPlacemarksShowHide(),
		'center': () => mainStore.centerPlacemarkShowHide(),
		'undo': () => mainStore.undo(),
		'redo': () => mainStore.redo(),
	};
	const action = actions[shortcut];
	if (action) action();
};
const windowResize = (): void => {
	const width = window.innerWidth;
	compact.value = width > constants.compact
		? 0
		: width > constants.compactUltra
			? 1
			: 2;
	compactControlButtons.value = width <= constants.compactControlButtons;
};
const sidebarDragStart = (event: Event, what: string): void => {
	event.preventDefault();
	sidebarDrag.value.what = what;
	let x: number, y: number;
	const touch = (event as TouchEvent).changedTouches?.[0];
	if (touch) {
		x = touch.pageX;
		y = touch.pageY;
	} else {
		x = (event as MouseEvent).screenX;
		y = (event as MouseEvent).screenY;
	}
	sidebarDrag.value.x = x;
	sidebarDrag.value.y = y;
	const { value: size } = sidebarSize;
	switch (what) {
		case 'top':
			sidebarDrag.value.h = size.top;
			break;
		case 'bottom':
			sidebarDrag.value.h = size.bottom;
			break;
		case 'left':
			sidebarDrag.value.w = size.left;
			break;
		case 'right':
			sidebarDrag.value.w = size.right;
			break;
	}
};
const rootMouseOver = (event: Event): void => {
	if (!sidebarDrag.value.what) return;
	const isTouch = (event as TouchEvent).changedTouches !== undefined;
	const getCoord = (axis: 'X' | 'Y') =>
		isTouch
			? (event as TouchEvent).changedTouches[0][`page${axis}`]
			: (event as MouseEvent)[`screen${axis}`];
	switch (sidebarDrag.value.what) {
		case 'top': {
			const newTop = sidebarDrag.value.h - sidebarDrag.value.y + getCoord('Y');
			sidebarSize.value.top = newTop < constants.sidebars.top ? 0 : newTop;
			break;
		}
		case 'bottom': {
			const newBottom = sidebarDrag.value.h + sidebarDrag.value.y - getCoord('Y');
			sidebarSize.value.bottom = newBottom < constants.sidebars.bottom ? 0 : newBottom;
			break;
		}
		case 'left': {
			const newLeft = sidebarDrag.value.w - sidebarDrag.value.x + getCoord('X');
			sidebarSize.value.left = newLeft < constants.sidebars.top ? 0 : newLeft;
			break;
		}
		case 'right': {
			const newRight = sidebarDrag.value.w + sidebarDrag.value.x - getCoord('X');
			sidebarSize.value.right = newRight < constants.sidebars.top ? 0 : newRight;
			break;
		}
	}
};
const rootMouseOverTrottled = throttle(rootMouseOver, 10);

const sidebarDragStop = (): void => {
	sidebarDrag.value.what = null;
};
// Search places by name
const rangeInput = ref(null);
const searchInput = ref(null);
const searchInputEvent = (event: KeyboardEvent): void => {
	const input = event.target as HTMLInputElement;
	if (event.code === "Escape") {
		input.value = '';
		selectPlaces('');
		return;
	}
	if (event.code === "Enter") {
		selectPlaces(input.value);
	}
};
const selectPlaces = (text: string): void => {
	const regexp = new RegExp(text, 'i');
	const folders = mainStore.treeFlat;
	for (const id in mainStore.places) {
		if (regexp.test(mainStore.places[id].name)) {
			mainStore.places[id].show = true;
			if (
				text.length !== 0 &&
				!folders[mainStore.places[id].folderid].opened
			) {
				mainStore.folderOpenClose({
					folder: folders[mainStore.places[id].folderid],
					opened: true,
				});
			}
		} else {
			mainStore.places[id].show = false;
		}
	}
};
</script>

<style lang="scss" scoped>
.admin-link {
	position: relative;
	top: -10px; left: 5px;
	font-size: 55%;
	text-transform: lowercase;
}
.actions-button {
	display: flex;
	flex-direction: column;
	padding: 4px 0 1px 0;
	line-height: 0.7;
	font-size: 11px !important;
	text-transform: lowercase;
	overflow: hidden;
	* {
		text-align: center;
		width: 100%;
	}
	*:first-child {
		flex-grow: 1;
		font-size: 17px !important;
	}
}
.control-buttons {
	display: flex;
	flex-flow: row wrap;
	gap: 8px;
	text-align: center;
	.actions-button {
		flex: 1 1 calc(25% - 16px);
		min-width: 50px;
		min-height: 30px;
	}
}
.control-search, .control-range, .control-measure dd {
	display: flex;
	flex-flow: row wrap;
	justify-content: flex-end;
	gap: 8px;
	margin-top: 8px;
	padding-left: 0;
	align-items: center;
	> *, .actions-button {
		flex: 0 1 auto;
		&:first-child {
			flex: 1 1 auto;
			min-width: 3em;
		}
	}
}
.control-search, .control-range, .control-measure {
	margin: 20px 0;
	> *:first-child {
		flex-basis: 0;
	}
}
.temps {
	display: grid;
	grid-template-columns: 1fr auto;
	gap: 20px;
	&-controls, &-buttons {
		display: flex;
		flex-flow: row wrap;
		gap: 8px;
	}
	&-buttons {
		justify-content: right;
		button {
			display: grid;
			grid-template-columns: 1fr auto;
			align-items: center;
			width: 40px;
			margin: 0;
			padding: 0 0 0 4px;
			& > *:last-child {
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 8px 6px;
				line-height: 0;
			}
		}
	}
}
.control-measure {
	strong {
		text-align: right;
	}
}
.place-button {
	cursor: pointer;
}
.two-fields {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 8px;
	margin-bottom: 8px;
	&__detailed_combined {
		grid-column: 1 / 3;
	}
	h4 {
		margin-bottom: -0.5rem;
	}
	> * {
		box-sizing: border-box;
		width: 100%;
	}
	input:is(:not([type="checkbox"])) {
		margin-bottom: 0 !important;
	}
	dd {
		display: flex;
		gap: 8px;
	}
	.two-fields__combined {
		grid-column: 1 / 3;
	}
}
</style>
