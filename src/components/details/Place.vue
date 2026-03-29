<template>
	<div
		v-if="mainStore.placesShow.show && mainStore.currentPlace"
		id="place-description"
	>
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
						{{ mainStore.descriptionFields[field] }}
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
							entity: mainStore.currentPlace,
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
									entity: mainStore.points[mainStore.currentPlace.pointid],
									change: {
										latitude: Number((e.currentTarget as HTMLInputElement).value.trim())
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
									entity: mainStore.points[mainStore.currentPlace.pointid],
									change: {
										longitude: Number((e.currentTarget as HTMLInputElement).value.trim())
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
										(e.currentTarget as HTMLInputElement).value.trim()
									);
									if (coords === null) return;
									mainStore.changePoint({
										entity: mainStore.points[mainStore.currentPlace.pointid],
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
				<dt>{{ mainStore.descriptionFields[field] }}</dt>
				<dd>
					<input
						:id="'detailed-' + field"
						v-model="mainStore.currentPlace[field]"
						type="datetime-local"
						:disabled="!!currentPlaceCommon"
						class="fieldwidth_100"
						@change="mainStore.changePlace({
							entity: mainStore.currentPlace,
							change: { [field]: mainStore.currentPlace[field] },
						})"
					/>
				</dd>
			</template>
			<template v-else-if="field === 'common'">
				<dd>
					<label v-if="!currentPlaceCommon">
						<input
							:id="'detailed-' + field"
							v-model="mainStore.currentPlace[field]"
							type="checkbox"
							:disabled="!!currentPlaceCommon"
							@change="mainStore.changePlace({
								entity: mainStore.currentPlace,
								change: { [field]: mainStore.currentPlace[field] },
							})"
						/>
						{{ mainStore.t.i.inputs.checkboxCommon }}
					</label>
				</dd>
			</template>

<!-- SEC Home -->

			<template v-else-if="field === 'home' && !currentPlaceCommon">
				<dd>
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
				</dd>
			</template>

<!-- SEC Name -->

			<template v-else>
				<dt>{{ mainStore.descriptionFields[field] }}</dt>
				<dd>
					<textarea
						:ref="el => {
							if (field === 'name') currentPlaceNameInputRef = el;
						}"
						v-model.trim="mainStore.currentPlace[field] as string"
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
							entity: mainStore.currentPlace,
							change: { [field]: mainStore.currentPlace[field] },
						})"
					/>
				</dd>
			</template>
		</dl>
		<div class="margin_top">
			<Images what="places" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, inject } from 'vue';
import { coords2string, string2coords } from '@/shared/converters';
import { useMainStore } from '@/stores/main';
import { Place } from '@/types'
import Images from '@/components/details/Images.vue';

const currentPlaceCommon = inject('currentPlaceCommon') as Ref<boolean>;
const currentPlaceNameInputRef = inject('currentPlaceNameInputRef');

const mainStore = useMainStore();

const linkEditing = ref(false);

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

type FieldKeys<T> = {
	[K in keyof T]: T[K] extends string | number | boolean | undefined ? K : never
}[keyof T];

type VirtualFields = 'point' | 'home';
type ValidField = (FieldKeys<Place> & keyof typeof mainStore.descriptionFields) | VirtualFields;

const orderedCurrentPlaceFields = ref<ValidField[]>([
	'name', 'description', 'point', 'link', 'time', 'srt', 'common', 'home',
]);
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
</style>
