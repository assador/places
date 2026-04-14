<template>
	<div v-if="orderedImages.length">
		<h3 class="margin_bottom_0">
			{{ mainStore.descriptionFields['images'] }}
		</h3>
		<div class="dd-images">
			<div
				v-for="image in orderedImages"
				:id="image.id"
				:key="image.id"
				:data-entity-id="image.id"
				:data-entity-context="what"
				class="image"
				:class="{
					draggable: !currentCommon,
					dragging: dragging,
				}"
				@pointerdown="e => onPointerDown(e, {
					id: image.id,
					type: 'image',
					context: what,
					parentId: current.id,
					ghostSelector: '.image-thumbnail',
				})"
			    @pointermove="onPointerMove"
			    @pointerup="e => onPointerUp(e, () => router.push({
					name: 'HomeImages',
					params: { imageId: image.id },
				}))"
			    @pointercancel="onPointerUp"
			>
				<div class="block_02">
					<img
						class="image-thumbnail border_1"
						:draggable="false"
						:src="constants.dirs.uploads.images.small + image.file"
						:alt="current.name"
						:title="current.name"
					/>
					<div
						v-if="!currentCommon"
						class="dd-images__delete button"
						@click.stop.prevent
						@pointerdown.stop
						@pointerup.stop="mainStore.deleteImages({
							imageIds: [ image.id ],
							entity: current,
						})"
					>
						×
					</div>
				</div>
				<div
					class="sorting-area-left"
					:class="{ highlighted: image.id === highlightedLeft }"
				/>
				<div
					class="sorting-area-right"
					:class="{ highlighted: image.id === highlightedRight }"
				/>
			</div>
		</div>
	</div>
	<div
		v-if="!currentCommon && !current.deleted"
		class="images-add"
		@click.stop="inputUploadFiles.click()"
	>
		<button
			:disabled="uploading"
			class="images-add__button button-iconed icon icon-plus-circled"
		/>
		<div class="images-add__text">
			{{ !uploading
				? mainStore.t.i.buttons.addPhotos
				: mainStore.t.i.text.loading
			}}
		</div>
		<input
			ref="inputUploadFiles"
			type="file"
			name="files"
			accept="image/*"
			multiple
			class="images-add__input"
			:disabled="uploading"
			@change="e => inputUploadFilesChanged(e)"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, inject } from 'vue';
import { orderBy } from 'lodash';
import { useRouter } from 'vue-router';
import { useMainStore } from '@/stores/main';
import { constants } from '@/shared/constants';
import { usePointerDnD } from '@/shared/dnd';
import { Image } from '@/types';

export interface IImagesProps {
	what?: 'places' | 'routes';
}
const props = withDefaults(defineProps<IImagesProps>(), {
	what: 'places',
});

const uploadFiles = inject('uploadFiles') as (...args: any[]) => any;
const current = computed(() => {
	const map = {
		places: mainStore.currentPlace,
		routes: mainStore.currentRoute,
	};
	return map[props.what] || null;
});

const placeCommon = inject<Ref<boolean>>('currentPlaceCommon');
const routeCommon = inject<Ref<boolean>>('currentRouteCommon');

const currentCommon = computed(() => {
	const map = {
		places: placeCommon,
		routes: routeCommon,
	};
	return map[props.what]?.value || null;
});

const mainStore = useMainStore();
const router = useRouter();

const uploading = ref(false);
const inputUploadFiles = ref<HTMLInputElement | null>(null);

const orderedImages = computed<Image[]>(() =>
	current.value ? orderBy(current.value.images, 'srt') : []
);
const inputUploadFilesChanged = async (e: Event) => {
	uploading.value = true;
	await uploadFiles(e, current.value, inputUploadFiles.value);
	uploading.value = false;

}

// SEC DnD

const handleDrop = inject('handleDrop') as (...args: any[]) => any;

const dragging = ref(false);
const highlightedLeft = ref(null);
const highlightedRight = ref(null);

const updateHighlights = (target: HTMLElement | null) => {
	highlightedLeft.value = null;
	highlightedRight.value = null;
	if (!target || !mainStore.currentDrag) return;
	const area = target.closest('.sorting-area-left, .sorting-area-right');
	if (area) {
		const imageId = (area.closest('.image') as HTMLElement)?.dataset.entityId;
		const isLeft = area.classList.contains('sorting-area-left');
		mainStore.currentDrag.before = isLeft;
		if (isLeft) highlightedLeft.value = imageId;
		else highlightedRight.value = imageId;
	}
};
const { onPointerDown, onPointerMove, onPointerUp } = usePointerDnD({
    handleDrop,
    updateHighlights,
    canAcceptDrop: (target) => target.dataset.entityId !== mainStore.currentDrag?.id,
    onDragStateChange: (value) => { dragging.value = value; },
});
</script>

<style lang="scss" scoped>
.image {
	position: relative;
	cursor: pointer;
	user-select: none;
	&.dragging :is(.sorting-area-left, .sorting-area-right) {
		z-index: 30 !important;
	}
	* {
		z-index: 20;
	}
	.sorting-area-left, .sorting-area-right {
		position: absolute;
		top: 0; bottom: 0;
		z-index: 10;
	}
	.sorting-area-left {
		left: 0; right: 50%;
	}
	.sorting-area-right {
		right: 0; left: 50%;
	}
}
.dd-images {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(82px, 1fr));
	grid-gap: 12px;
	margin-top: 12px !important; margin-bottom: 12px !important;
	padding: 0;
}
.dd-images *[class*="block_"] {
	margin: 0;
	padding: 7px;
}
.dd-images__delete {
	display: flex;
	justify-content: center;
	align-items: center;
	position: absolute;
	top: -5px; right: -5px;
	width: 20px; height: 20px;
	min-height: 0;
	padding: 0;
	border-radius: 50%;
	font-size: 22px;
}
.images-add {
	display: flex;
	gap: 12px;
	align-items: center;
	cursor: pointer;
}
.images-add__text {
	flex: 1 0 auto;
}
.images-add__input {
	display: none;
}
</style>
