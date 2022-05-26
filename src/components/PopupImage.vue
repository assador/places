<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="close($event)"
	>
		<img
			v-if="image"
			class="popup-image border_1"
			:src="constants.dirs.uploads.images.big + image.file"
			:onerror="'this.src = \'' + constants.dirs.uploads.images.orphanedbig + image.file + '\''"
			@click="showImage(1, $event);"
		>
		<a
			href="javascript:void(0);"
			class="prev"
			@click="showImage(-1, $event);"
		>◀</a>
		<a
			href="javascript:void(0);"
			class="next"
			@click="showImage(1, $event);"
		>▶</a>
		<a
			href="javascript:void(0);"
			class="close"
			@click="close($event)"
		>×</a>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';
import _ from 'lodash';
import { constants } from '../shared/constants';
import { Place, Image } from '@/store/types';

export default Vue.extend({
	props: ['imageId'],
	data() {
		return {
			constants: constants,
			popuped: false,
			images: [] as Array<Image>,
			image: {} as Image,
		}
	},
	watch: {
		imageId() {
			this.defineVars();
		},
	},
	mounted() {
		this.popuped = true;
		this.defineVars();
		document.addEventListener('keyup', this.keyup, false);
	},
	beforeUpdate() {
		this.popuped = true;
	},
	beforeDestroy() {
		document.removeEventListener('keyup', this.keyup, false);
	},
	methods: {
		close(event: Event) {
			if (event) event.stopPropagation();
			this.$router.replace(
				this.$route.matched[this.$route.matched.length - 2].path
			);
		},
		defineVars() {
			const places: Record<string, Place> = (
				!(this.$root as Vue & {currentPlaceCommon: boolean}).currentPlaceCommon
					? this.$store.state.places
					: this.$store.state.commonPlaces
			);
			for (const id in places) {
				if (places[id].images && this.imageId in places[id].images) {
					this.image = places[id].images[this.imageId];
					this.images = _.orderBy(Object.values(places[id].images));
					return;
				}
			}
			this.$router.replace(
				this.$route.matched[this.$route.matched.length - 2].path
			);
		},
		showImage(step: number, event: Event) {
			event.stopPropagation();
				let currentIndex = this.images.indexOf(this.image);
				if (currentIndex > -1) {
					let ImagesLength = this.images.length;
					currentIndex = (currentIndex + step) % ImagesLength + (
						(currentIndex + step) % ImagesLength < 0 ? ImagesLength: 0
					);
					this.$router.push({
						name: 'HomeImages',
						params: {imageId: this.images[currentIndex].id}
					}).catch(() => {});
				}
		},
		keyup(event: Event) {
			switch (
				(constants.shortcuts as Record<string, string>)
					[(event as KeyboardEvent).keyCode]
			) {
				case 'close' :
					this.close(event);
					break;
				case 'left' :
					this.showImage(-1, event);
					break;
				case 'right' :
					this.showImage(1, event);
					break;
			}
		},
	},
});
</script>
