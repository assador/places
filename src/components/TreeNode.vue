<template>
	<li
		:id="'places-menu-folder-' + folderData.id"
		:title="folderData.description"
		:class="'places-menu-folder ' + (folderData.opened ? 'places-menu-folder_opened' : 'places-menu-folder_closed')"
	>
		<a
			v-if="!$root.foldersEditMode || folderData.id === 'root'"
			:id="'places-menu-folder-link-' + folderData.id"
			:srt="folderData.srt"
			href="javascript: void(0);"
			class="folder-button"
			draggable="true"
			@click="$store.commit('folderOpenClose', {folder: (folderData.id === 'root' ? $parent.data : folder), opened: folderData.opened ? false : true});"
			@dragstart="$root.handleDragStart"
			@dragenter="$root.handleDragEnter"
			@dragleave="$root.handleDragLeave"
		>
			{{ folderData.name }}
		</a>
		<span
			v-if="$root.foldersEditMode && folderData.id !== 'root'"
			:id="'places-menu-folder-link-' + folderData.id"
			class="folder-button"
			@click="$store.commit('folderOpenClose', {folder: folder, opened: folderData.opened ? false : true});"
		>
			<input
				v-model="folderData.name"
				placeholder="Название"
				class="folder-button__name fieldwidth_100"
				@change="$store.commit('changeFolder', {folder: folderData, change: {updated: true}});"
				onclick="event.stopPropagation(); $store.commit('setIdleTime', 0);"
			/>
			<a
				class="folder-button__delete"
				title="Удалить папку"
				@click="$event.stopPropagation(); $root.showPopup({show: true, type: 'folderDelete', data: {folder: folder, parent: parent}}, $event);"
			>
				×
			</a>
			<textarea
				v-model="folderData.description"
				rows="2"
				placeholder="Описание"
				class="folder-button__description fieldwidth_100"
				@change="$store.commit('changeFolder', {folder: folderData, change: {updated: true}});"
				onclick="event.stopPropagation(); $store.commit('setIdleTime', 0);"
			></textarea>
		</span>
		<ul v-if="folderData.children && folderData.children.length" class="margin_bottom_0">
			<folder
				v-for="(child, index) in orderedChildren"
				:key="folderData.id + index"
				:folder="child"
				:parent="folderData"
			>
			</folder>
		</ul>
		<div :id="folderData.id" class="places-menu-item">
			<div
				v-for="place in orderedPlaces"
				v-if="place.folderid === folderData.id && place.show"
				:key="place.id"
				:id="place.id"
				:srt="place.srt"
				:title="place.description"
				:class="'place-button block_01 draggable' + (place === $store.state.currentPlace ? ' active' : '')"
				draggable="true"
				@click="$root.setCurrentPlace(place);"
				@dragstart="$root.handleDragStart"
			>
				{{ place.name }}
				<div
					class="place-button__dragenter-area place-button__dragenter-area_top"
					@dragenter="$root.handleDragEnter"
					@dragleave="$root.handleDragLeave"
				>
				</div>
				<div
					class="place-button__dragenter-area place-button__dragenter-area_bottom"
					@dragenter="$root.handleDragEnter"
					@dragleave="$root.handleDragLeave"
				>
				</div>
			</div>
		</div>
		<div
			v-if="folderData.id !== 'root'"
			class="places-menu-folder__dragenter-area places-menu-folder__dragenter-area_top"
			@click="$store.commit('folderOpenClose', {folder: folder, opened: folderData.opened ? false : true});"
			@dragenter="$root.handleDragEnter"
			@dragleave="$root.handleDragLeave"
		>
		</div>
		<div
			v-if="folderData.id !== 'root'"
			class="places-menu-folder__dragenter-area places-menu-folder__dragenter-area_bottom"
			@click="$store.commit('folderOpenClose', {folder: folder, opened: folderData.opened ? false : true});"
			@dragenter="$root.handleDragEnter"
			@dragleave="$root.handleDragLeave"
		>
		</div>
	</li>
</template>

<script>
import _ from "lodash"
import {bus} from "../shared/bus.js"
export default {
	name: "folder",
	props: {
		folder: {
			type: Object,
			required: true,
		},
		parent: {
			type: Object,
			required: true,
		},
	},
	data: function() {return {
		folderData: {},
	}},
	watch: {
		folder: {
			deep: true,
			immediate: true,
			handler: function(folder) {
				this.folderData = {
					...folder,
					children: folder.children,
				};
			},
		},
	},
	computed: {
		orderedChildren: function() {
			return _.orderBy(this.folderData.children, "srt");
		},
		orderedPlaces: function() {
			return _.orderBy(this.$store.state.places, "srt");
		},
	},
}
</script>
