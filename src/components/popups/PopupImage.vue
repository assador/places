<template>
	<Teleport to="#popup-root">
		<transition name="fade">
			<div
				v-if="props.id"
				v-bind="$attrs"
				class="popup"
				@pointerdown="e => { if (common.compact === 2) onSwipeDown(e); }"
				@pointerup="e => { if (common.compact === 2) onSwipeUp(e); }"
			>
				<img
					v-if="image"
					class="popup-image border_1"
					:src="imageSrc"
					@load="setBusy(false)"
				/>
				<a
					v-if="common.compact !== 2 && props.images && props.images.length > 1"
					class="prev"
					:class="{ highlighted: prevOver }"
					@mouseenter="prevOver = true"
					@mouseleave="prevOver = false"
					@click.stop="showImage(-1)"
				>
					<span class="icon icon-triangle" />
				</a>
				<a
					v-if="common.compact !== 2 && props.images && props.images.length > 1"
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
				>
					×
				</a>
			</div>
		</transition>
	</Teleport>
</template>

<script setup lang="ts">
import {
	ref,
	computed,
	watch,
	onMounted,
	onUnmounted,
} from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter, useRoute } from 'vue-router';
import { common, setBusy } from '@/services/common';
import { useSwipe } from '@/services/swipe';
import { constants } from '@/shared/constants';
import { Image } from '@/types';

interface PopupImageProps {
	id?: string;
	images?: Image[];
}
const props = withDefaults(defineProps<PopupImageProps>(), {
	id: undefined,
	images: undefined,
});
const emit = defineEmits([ 'update:id' ]);
defineOptions({ inheritAttrs: false });

const { onPointerDown: onSwipeDown, onPointerUp: onSwipeUp } = useSwipe({
	onSwipeLeft: () => showImage(1),
	onSwipeRight: () => showImage(-1),
	threshold: 60,
});

const index = ref<number | null>(null);
const prevOver = ref(false);
const nextOver = ref(false);

const mainStore = useMainStore();
const router = useRouter();
const route = useRoute();

const image = computed<Image | undefined>(() =>
	props.images
		? (props.images[
			index.value !== null ? index.value : props.images.findIndex(i => i.id === props.id)
		])
		: props.id ? mainStore.getAllImages[props.id] ?? undefined : undefined
);
const imageSrc = computed<string>(() =>
	!image.value ? '' :
	(image.value.new && image.value.preview) ? image.value.preview :
	(constants.dirs.uploads.images.big + image.value.file)
);
watch(imageSrc, (newSrc) => {
	if (newSrc) setBusy(true);
});

const close = () => {
	if (route.name === 'Images') router.push({ name: 'Home' });
	else emit('update:id', null);
};
const showImage = (step: number) => {
	if (!props.images) return;
	if (index.value === null || index.value < 0) index.value = 0;
	const len = props.images.length;
	index.value = (index.value + step) % len + (
		(index.value + step) % len < 0 ? len : 0
	);
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

onMounted(() => {
	document.addEventListener('keyup', keyup, false);
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
});
</script>

<style lang="scss" scoped>
.popup {
	padding: 0;
	user-select: none;
	touch-action: pan-y;
	-webkit-user-drag: none;
	.popup-image {
		display: block;
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
		image-orientation: from-image;
		z-index: 10;
		user-drag: none;
		-webkit-user-drag: none;
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
