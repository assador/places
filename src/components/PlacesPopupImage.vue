<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="e => close(e)"
	>
		<img
			v-if="image"
			class="popup-image border_1"
			:src="constants.dirs.uploads.images.big + image.file"
			:onerror="'this.src = \'' + constants.dirs.uploads.images.orphanedbig + image.file + '\''"
			@click="e => showImage(1, e)"
		>
		<a
			href="javascript:void(0);"
			class="prev"
			@click="e => showImage(-1, e)"
		>◀</a>
		<a
			href="javascript:void(0);"
			class="next"
			@click="e => showImage(1, e)"
		>▶</a>
		<a
			href="javascript:void(0);"
			class="close"
			@click="e => close(e)"
		>×</a>
	</div>
</template>

<script setup lang="ts">
import {
	ref,
	inject,
	watch,
	onMounted,
	onBeforeUnmount,
	onBeforeUpdate,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStore } from 'vuex';
import _ from 'lodash';
import { constants } from '@/shared/constants';
import { Place, Image } from '@/store/types';

export interface IPlacesPopupImageProps {
	imageId?: string;
}
const props = withDefaults(defineProps<IPlacesPopupImageProps>(), {
	imageId: '',
});

const popuped = ref(false);
const images = ref([] as Array<Image>);
const image = ref({} as Image);

const currentPlaceCommon = inject('currentPlaceCommon');

const store = useStore();
const router = useRouter();
const route = useRoute();

const close = (event?: Event): void => {
	if (event) event.stopPropagation();
	router.replace(
		route.matched[route.matched.length - 2].path
	);
};
const defineVars = (): void => {
	const places: Record<string, Place> = (
		!currentPlaceCommon.value
			? store.state.places
			: store.state.commonPlaces
	);
	for (const id in places) {
		if (places[id].images && props.imageId in places[id].images) {
			image.value = places[id].images[props.imageId];
			images.value = _.orderBy(Object.values(places[id].images));
			return;
		}
	}
	router.replace(route.matched[route.matched.length - 2].path);
};
const showImage = (step: number, event?: Event) => {
	if (event) event.stopPropagation();
	let currentIndex = images.value.indexOf(image.value);
	if (currentIndex > -1) {
		const ImagesLength = images.value.length;
		currentIndex = (currentIndex + step) % ImagesLength + (
			(currentIndex + step) % ImagesLength < 0 ? ImagesLength: 0
		);
		router.push({
			name: 'PlacesHomeImages',
			params: {imageId: images.value[currentIndex].id}
		}).catch(e => {console.error(e);});
	}
};
const keyup = (event: Event): void => {
	switch (
		(constants.shortcuts as Record<string, string>)
			[(event as KeyboardEvent).code]
	) {
		case 'close' :
			close(event);
			break;
		case 'left' :
			showImage(-1, event);
			break;
		case 'right' :
			showImage(1, event);
			break;
	}
};

watch(() => props.imageId, () => {
	defineVars();
});
onMounted(() => {
	popuped.value = true;
	defineVars();
	document.addEventListener('keyup', keyup, false);
});
onBeforeUpdate(() => {
	popuped.value = true;
});
onBeforeUnmount(() => {
	document.removeEventListener('keyup', keyup, false);
});
</script>
