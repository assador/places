<template>
	<div v-if="orderedImages.length">
		<h3 class="margin_bottom_0">
			{{ mainStore.descriptionFields['images'] }}
		</h3>
		<div
			class="dd-images"
			:class="{ dragging: dragging }"
		>
			<div
				v-for="image in orderedImages"
				:id="image.id"
				:key="image.id"
				:data-entity-id="image.id"
				:data-entity-context="props.what"
				class="image"
				:class="{ draggable: own }"
				@pointerdown="e => onPointerDown(e, {
					id: image.id,
					type: 'image',
					context: props.what,
					parentId: current?.id,
					ghostSelector: '.image-thumbnail',
				})"
			    @pointermove="onPointerMove"
			    @pointerup="e => onPointerUp(e, () => popupImageId = image.id)"
			    @pointercancel="onPointerUp"
			>
				<div class="block_02">
					<img
						class="image-thumbnail border_1"
						:draggable="false"
						:src="image.new
							? image.preview
							: constants.dirs.uploads.images.small + image.file
						"
						:alt="current?.name"
						:title="current?.name"
					/>
					<div
						v-if="own"
						class="dd-images__delete button"
						@pointerdown.stop
						@pointerup.stop
						@click.stop="() => {
							if(!current) return;
							mainStore.deleteImages({
								imageIds: [ image.id ],
								entity: current,
							});
						}"
					>
						×
					</div>
				</div>
				<div
					class="sorting-area-before"
					:class="{
						highlighted:
							image.id === dragTargetId &&
							mainStore.currentDrag &&
							mainStore.currentDrag.position === 'before'
					}"
				/>
				<div
					class="sorting-area-after"
					:class="{
						highlighted:
							image.id === dragTargetId &&
							mainStore.currentDrag &&
							mainStore.currentDrag.position === 'after'
					}"
				/>
			</div>
		</div>
	</div>
	<div
		v-if="own && current && !current.deleted"
		class="images-add"
		@click.stop="if (isFileInput(inputUploadFiles)) { inputUploadFiles.click(); }"
	>
		<button
			class="images-add__button button-iconed icon icon-plus-circled"
		/>
		<div class="images-add__text">
			{{ mainStore.t.i.buttons.addPhotos }}
		</div>
		<input
			ref="inputUploadFiles"
			type="file"
			name="files"
			accept="image/*"
			capture="environment"
			multiple
			class="images-add__input"
			@change="inputUploadFilesChanged"
		/>
	</div>
	<PopupImage
		v-if="popupImageId"
		:id="popupImageId"
		:images="orderedImages"
		@update:id="popupImageId = $event"
	/>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { orderBy } from 'lodash';
import { useMainStore } from '@/stores/main';
import { Image } from '@/types';
import { isFileInput } from '@/guards';
import { addImages } from '@/services/common';
import { usePointerDnD, handleDrop } from '@/services/dnd';
import { constants } from '@/shared/constants';
import PopupImage from '@/components/popups/PopupImage.vue';

export interface ImagesProps {
	what: 'places' | 'routes';
}
const props = defineProps<ImagesProps>();

const mainStore = useMainStore();

const popupImageId = ref<string | null>(null);
const inputUploadFiles = ref<HTMLInputElement | null>(null);

const current = computed(() => {
	const map = {
		places: mainStore.currentPlace,
		routes: mainStore.currentRoute,
	};
	return map[props.what];
});
const orderedImages = computed<Image[]>(() =>
	current.value ? orderBy(current.value.images, 'srt') : []
);
const inputUploadFilesChanged = (e: Event) => {
	if (current.value) addImages(current.value, e.target as HTMLInputElement);
};
const own = computed(() => current.value && current.value.userid === mainStore.user?.id);

// SEC DnD

const dragging = ref(false);
const dragTargetId = ref<string | undefined>(undefined);

const updateHighlights = (target: HTMLElement | null) => {
	dragTargetId.value = undefined;
	if (!target || !mainStore.currentDrag) return;
	const area = target.closest('.sorting-area-before, .sorting-area-after');
	if (area) {
		const item = area.closest('[data-entity-id]') as HTMLElement;
		dragTargetId.value = item?.dataset.entityId;
		if (area.classList.contains('sorting-area-before')) mainStore.currentDrag.position = 'before';
		else if (area.classList.contains('sorting-area-after')) mainStore.currentDrag.position = 'after';
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
.dd-images {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(82px, 1fr));
	grid-gap: 12px;
	margin-top: 12px !important; margin-bottom: 12px !important;
	padding: 0;
	* {
		touch-action: none;
		user-select: none;
	}
	&.dragging :is(.sorting-area-before, .sorting-area-after) {
		z-index: 30 !important;
	}
}
.image {
	position: relative;
	cursor: pointer;
	user-select: none;
	* {
		z-index: 20;
	}
	.sorting-area-before, .sorting-area-after {
		position: absolute;
		top: 0; bottom: 0;
		z-index: 10;
	}
	.sorting-area-before {
		left: 0; right: 50%;
	}
	.sorting-area-after {
		right: 0; left: 50%;
	}
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
