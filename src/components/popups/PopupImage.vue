<template>
	<div class="popup">
		<img
			v-if="image"
			class="popup-image border_1"
			:src="constants.dirs.uploads.images.big + image.file"
			:onerror="'this.src = \'' + constants.dirs.uploads.images.orphanedbig + image.file + '\''"
			@click="e => showImage(1, e)"
		/>
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
			@click="close()"
		>×</a>
	</div>
</template>

<script setup lang="ts">
import {
	ref, Ref,
	inject,
	watch,
	onMounted,
	onUnmounted,
} from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMainStore } from '@/stores/main';
import _ from 'lodash';
import { constants } from '@/shared';
import { Place, Image } from '@/stores/types';

export interface IPlacesPopupImageProps {
	imageId?: string;
}
const props = withDefaults(defineProps<IPlacesPopupImageProps>(), {
	imageId: '',
});

const images = ref([] as Array<Image>);
const image = ref({} as Image);

const currentPlaceCommon = inject<Ref<boolean>>('currentPlaceCommon');

const mainStore = useMainStore();
const router = useRouter();
const route = useRoute();

const close = (): void => {
	router.replace(route.matched[route.matched.length - 2].path);
};
const defineVars = (): void => {
	const places: Record<string, Place> = (
		!currentPlaceCommon.value
			? mainStore.places
			: mainStore.commonPlaces
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
			name: 'HomeImages',
			params: {imageId: images.value[currentIndex].id},
		});
	}
};
const keyup = (event: KeyboardEvent): void => {
	switch (event.key) {
		case 'Escape' :
			close();
			break;
		case 'ArrowLeft' :
			showImage(-1, event);
			break;
		case 'ArrowRight' :
			showImage(1, event);
			break;
	}
};

watch(() => props.imageId, () => {
	defineVars();
});
onMounted(() => {
	defineVars();
	document.addEventListener('keyup', keyup, false);
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
});
</script>

<style lang="scss" scoped>
.appear, .disappear {
	transition: opacity 10s;
}
.appear {
	opacity: 1;
}
.disappear {
	opacity: 0;
}
</style>
