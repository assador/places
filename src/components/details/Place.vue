<template>
	<div v-if="mainStore.placesShow.show && mainStore.currentPlace" id="place-description">
		<h2
			v-if="mainStore.routesShow"
				class="color-01"
		>
			{{ mainStore.t.i.captions.currentPlace }}
		</h2>
		<dl
			v-for="field in orderedCurrentPlaceFields"
			:key="field"
			class="place-detailed margin_bottom_0"
		>
			<template v-if="field === 'link' || field === 'srt'">
				<dt>
					<a
						v-if="
							field === 'link' &&
							!linkEditing &&
							mainStore.currentPlace[field].trim()
						"
						:href="mainStore.currentPlace[field].trim()"
						target="_blank"
					>
						{{ mainStore.descriptionFields[field] }}
					</a>
					<span v-else>
						{{ mainStore.descriptionFields[field] }}:
					</span>
				</dt>
				<dd>
					<input
						:id="'place-detailed-' + field"
						v-model.number.trim="mainStore.currentPlace[field]"
						:type="field === 'srt' ? 'number' : 'text'"
						:disabled="!!currentPlaceCommon"
						class="fieldwidth_100"
						@change="mainStore.changePlace({
							place: mainStore.currentPlace,
							change: { [field]: mainStore.currentPlace[field] }
						})"
						:placeholder="field"
					/>
				</dd>
			</template>
			<template v-else-if="field === 'point'">
				<div class="two-fields">
					<div>
						<dt>
							{{ mainStore.descriptionFields['latitude'] }} °
						</dt>
						<dd>
							<input
								id="detailed-latitude"
								:value="currentPlaceLat"
								type="number"
								:disabled="!!currentPlaceCommon"
								class="fieldwidth_100"
								@change="e => mainStore.changePoint({
									point: mainStore.points[mainStore.currentPlace.pointid],
									change: {
										latitude: Number((e.target as HTMLInputElement).value.trim())
									},
								})"
							/>
						</dd>
					</div>
					<div>
						<dt>
							{{ mainStore.descriptionFields['longitude'] }} °
						</dt>
						<dd>
							<input
								id="detailed-longitude"
								:value="currentPlaceLon"
								type="number"
								:disabled="!!currentPlaceCommon"
								class="fieldwidth_100"
								@change="e => mainStore.changePoint({
									point: mainStore.points[mainStore.currentPlace.pointid],
									change: {
										longitude: Number((e.target as HTMLInputElement).value.trim())
									},
								})"
							/>
						</dd>
					</div>
					<div class="two-fields__combined">
						<dt>
							{{ mainStore.descriptionFields['coordsMinSec'] }}
						</dt>
						<dd>
							<input
								id="detailed-coordinates"
								:value="currentDegMinSec"
								type="text"
								:disabled="!!currentPlaceCommon"
								class="fieldwidth_100"
								@change="e => {
									const coords = string2coords(
										(e.target as HTMLInputElement).value.trim()
									);
									if (coords === null) return;
									mainStore.changePoint({
										point: mainStore.points[mainStore.currentPlace.pointid],
										change: {
											latitude: coords[0],
											longitude: coords[1],
										},
									});
								}"
							/>
						</dd>
					</div>
				</div>
				<div class="place-detailed__altitude margin_bottom_1">
					<strong>
						{{ mainStore.descriptionFields['altitudecapability'] }}:
					</strong>
					<span class="nobr right">
						{{ currentPlaceAlt === null ? '?' : currentPlaceAlt }}
						{{ mainStore.t.i.text.m }}
					</span>
				</div>
			</template>
			<template v-else-if="field === 'time'">
				<dt>{{ mainStore.descriptionFields[field] }}:</dt>
				<dd>
					<input
						:id="'detailed-' + field"
						v-model="mainStore.currentPlace[field]"
						type="datetime-local"
						:disabled="!!currentPlaceCommon"
						class="fieldwidth_100"
						@change="mainStore.changePlace({
							place: mainStore.currentPlace,
							change: { [field]: mainStore.currentPlace[field] },
						})"
					/>
				</dd>
			</template>
			<template v-else-if="field === 'common'">
				<dd class="margin_bottom">
					<label v-if="!currentPlaceCommon">
						<input
							:id="'detailed-' + field"
							v-model="mainStore.currentPlace[field]"
							type="checkbox"
							:disabled="!!currentPlaceCommon"
							@change="mainStore.changePlace({
								place: mainStore.currentPlace,
								change: { [field]: mainStore.currentPlace[field] },
							})"
						/>
						{{ mainStore.t.i.inputs.checkboxCommon }}
					</label>
				</dd>
			</template>
			<template v-else-if="field === 'images' && orderedImages.length">
				<dt>{{ mainStore.descriptionFields[field] }}:</dt>
				<dd id="place-images">
					<div class="dd-images">
						<div
							v-for="image in orderedImages"
							:id="image.id"
							:key="image.id"
							:data-image="image.id"
							class="place-image"
							:class="
								(currentPlaceCommon ? '' : ' draggable')
							"
							:draggable="currentPlaceCommon ? false : true"
							@click="router.push({
								name: 'HomeImages',
								params: { imageId: image.id },
							})"
							@dragstart="e => handleDragStart(e, 'images')"
							@dragenter="handleDragEnter"
						>
							<div
								:data-image="image.id"
								class="block_02"
							>
								<img
									:data-image="image.id"
									class="image-thumbnail border_1"
									:draggable="false"
									:src="constants.dirs.uploads.images.small + image.file"
									:alt="mainStore.currentPlace.name"
									:title="mainStore.currentPlace.name"
								/>
								<div
									v-if="!currentPlaceCommon"
									:data-image="image.id"
									class="dd-images__delete button"
									:draggable="false"
									@click.stop="
										emitter.emit('confirm', {
											func: deleteImages,
											args: [{[image.id]: image}],
										})
									"
								>
									×
								</div>
							</div>
							<div
								:data-image="image.id"
								class="sorting-area-left"
								:class="{ highlighted: image.id === highlightedLeft }"
								@dragenter="highlightedLeft = image.id"
								@dragleave="highlightedLeft = null"
								@drop="(e) => handleDrop(e, { before: true })"
							/>
							<div
								:data-image="image.id"
								class="sorting-area-right"
								:class="{ highlighted: image.id === highlightedRight }"
								@dragenter="highlightedRight = image.id"
								@dragleave="highlightedRight = null"
								@drop="(e) => handleDrop(e, { before: false })"
							/>
						</div>
					</div>
				</dd>
			</template>

<!-- SEC Field Name -->

			<template v-else-if="field !== 'images'">
				<dt>{{ mainStore.descriptionFields[field] }}:</dt>
				<dd>
					<textarea
						:ref="el => {
							if (field === 'name') currentPlaceNameInputRef = el;
						}"
						v-model.trim="mainStore.currentPlace[field]"
						:id="'place-detailed-' + field"
						:disabled="!!currentPlaceCommon"
						:placeholder="
							field === 'name'
								? mainStore.t.i.inputs.placeName
								: (field === 'description'
									? mainStore.t.i.inputs.placeDescription
									: ''
								)
						"
						class="fieldwidth_100"
						@change="mainStore.changePlace({
							place: mainStore.currentPlace,
							change: { [field]: mainStore.currentPlace[field] },
						})"
					/>
				</dd>
			</template>
		</dl>
		<div
			v-if="!currentPlaceCommon && !mainStore.currentPlace.deleted"
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
		<div v-if="!currentPlaceCommon">
			<label>
				<input
					id="checkbox-homeplace"
					type="checkbox"
					:checked="mainStore.currentPlace === mainStore.homePlace"
					@change="e => {
						mainStore.setHomePlace({
							id: (e.target as HTMLInputElement).checked
								? mainStore.currentPlace.id
								: null
						});
						mainStore.backupState();
					}"
				/>
				{{ mainStore.t.i.inputs.checkboxHome }}
			</label>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, inject } from 'vue';
import { orderBy } from 'lodash';
import { emitter, constants, coords2string, string2coords } from '@/shared';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { Image } from '@/stores/types';

const uploadFiles = inject('uploadFiles') as (...args: any[]) => any;
const deleteImages = inject('deleteImages') as (...args: any[]) => any;
const handleDragStart = inject('handleDragStart') as (...args: any[]) => any;
const handleDragEnter = inject('handleDragEnter') as (...args: any[]) => any;
const handleDrop = inject('handleDrop') as (...args: any[]) => any;
const currentPlaceCommon = inject('currentPlaceCommon') as Ref<boolean>;

const mainStore = useMainStore();
const router = useRouter();

const linkEditing = ref(false);
const highlightedLeft = ref(null);
const highlightedRight = ref(null);

const currentPlaceNameInputRef = inject('currentPlaceNameInputRef');

const currentPlaceLat = computed<number | null>(() =>
	mainStore.currentPlace
		? mainStore.points[mainStore.currentPlace.pointid]?.latitude ?? null
		: null
);
const currentPlaceLon = computed<number | null>(() =>
	mainStore.currentPlace
		? mainStore.points[mainStore.currentPlace.pointid]?.longitude ?? null
		: null
);

const orderedCurrentPlaceFields = ref([
	'name', 'description', 'point', 'link', 'time', 'srt', 'common', 'images',
]);
const orderedImages = computed<Array<Image>>(() =>
	mainStore.currentPlace ? orderBy(mainStore.currentPlace.images, 'srt') : []
);
const currentPlaceAlt = computed<number | null>(() => {
	return (
		mainStore.currentPlace
			? mainStore.points[mainStore.currentPlace.pointid]?.altitude ?? null
			: null
		);
});
const currentDegMinSec = computed(() =>
	coords2string([currentPlaceLat.value, currentPlaceLon.value])
);
</script>

<style lang="scss" scoped>
.place-detailed {
	dd {
		padding-left: 0;
	}
	:is(
		textarea,
		input:is([type="text"], [type="number"], [type="datetime-local"])
	) {
		display: inline-block;
		margin: 3px 0 8px 0;
	}
	&__link-dt:last-child {
		margin-bottom: 8px;
	}
	&__link-dt * {
		display: inline-block;
	}
	&__link-edit {
		float: right;
	}
	&__altitude {
		text-align: right;
	}
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
.place-image {
	position: relative;
	* {
		pointer-events: none;
	}
	.image-thumbnail,
	.dd-images__delete,
	.sorting-area-left,
	.sorting-area-right {
		pointer-events: auto;
	}
	.sorting-area-left, .sorting-area-right {
		position: absolute;
		top: 0; bottom: 0;
	}
	.sorting-area-left {
		left: 0; right: 50%;
	}
	.sorting-area-right {
		right: 0; left: 50%;
	}
}
</style>
