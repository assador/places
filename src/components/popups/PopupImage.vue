<template>
	<div class="popup">
		<img
			v-if="image"
			class="popup-image border_1"
			:src="constants.dirs.uploads.images.big + image.file"
			:onerror="`this.src = '${constants.dirs.uploads.images.orphanedbig + image.file}'`"
		/>
		<a
			class="prev"
			:class="{ highlighted: prevOver }"
			@mouseenter="prevOver = true"
			@mouseleave="prevOver = false"
			@click.stop="showImage(-1)"
		>
			<span class="icon icon-triangle" />
		</a>
		<a
			class="next"
			:class="{ highlighted: nextOver }"
			@mouseenter="nextOver = true"
			@mouseleave="nextOver = false"
			@click.stop="showImage(1)"
		>
			<span class="icon icon-triangle" />
		</a>
		<a
			href="javascript:void(0);"
			class="close"
			@click.stop="close"
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
import { Place, Image } from '@/types';

export interface IPlacesPopupImageProps {
	imageId?: string;
}
const props = withDefaults(defineProps<IPlacesPopupImageProps>(), {
	imageId: '',
});

const images = ref([] as Array<Image>);
const image = ref({} as Image);

const prevOver = ref(false);
const nextOver = ref(false);

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
const showImage = (step: number) => {
	let currentIndex = images.value.indexOf(image.value);
	if (currentIndex > -1) {
		const ImagesLength = images.value.length;
		currentIndex = (currentIndex + step) % ImagesLength + (
			(currentIndex + step) % ImagesLength < 0 ? ImagesLength: 0
		);
		router.push({
			name: 'HomeImages',
			params: { imageId: images.value[currentIndex].id },
		});
	}
};
const keyup = (event: KeyboardEvent): void => {
	switch (event.key) {
		case 'Escape' :
			close();
			break;
		case 'ArrowLeft' :
			showImage(-1);
			break;
		case 'ArrowRight' :
			showImage(1);
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
.popup {
	padding: 0;
	.popup-image {
		display: block;
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		image-orientation: from-image;
		z-index: 10;
	}
	.prev, .next {
		position: absolute;
		top: 0; bottom: 0;
		width: auto; height: auto;
		cursor: pointer;
		z-index: 20;
		user-select: none;
		-webkit-user-drag: none;
		.icon {
			display: block;
			position: absolute;
			top: 50%; right: 25%; bottom: auto; left: 25%;
			width: auto; height: auto;
			aspect-ratio: 1 / 1;
			opacity: 0;
		}
		&:hover .icon {
			opacity: 0.5;
		}
	}
	.prev {
		left: 0; right: 75%;
		.icon {
			transform: translateY(-50%) rotate(-90deg);
		}
	}
	.next {
		right: 0; left: 75%;
		.icon {
			transform: translateY(-50%) rotate(90deg);
		}
	}
	.close {
		z-index: 30;
	}
}
</style>
