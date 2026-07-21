<template>
	<div
		v-if="mainStore.placesShow.show && mainStore.currentPlace"
		id="place-description"
	>
		<h2
			v-if="mainStore.routesShow.show"
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
							mainStore.currentPlace[field]?.trim()
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
						:value="mainStore.currentPlace[field]"
						:type="field === 'srt' ? 'number' : 'text'"
						:disabled="!own"
						class="fieldwidth_100"
						@change="mainStore.changePlace({
							entity: mainStore.currentPlace,
							change: { [field]: ($event.target as HTMLInputElement).value.trim() }
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
								:disabled="!own"
								class="fieldwidth_100"
								@change="onChangeLatitude"
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
								:disabled="!own"
								class="fieldwidth_100"
								@change="onChangeLongitude"
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
								:disabled="!own"
								class="fieldwidth_100"
								@change="onChangeCoords"
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
						:value="unixTimestampToISO8601(mainStore.currentPlace[field])"
						type="datetime-local"
						:disabled="!own"
						class="fieldwidth_100"
						@change="mainStore.changePlace({
							entity: mainStore.currentPlace,
							change: { [field]: iso8601ToUnixTimestamp(($event.target as HTMLInputElement).value) },
						})"
					/>
				</dd>
			</template>
			<template v-else-if="field === 'common'">
				<dd>
					<label v-if="own">
						<input
							:id="'detailed-' + field"
							:checked="!!mainStore.currentPlace[field]"
							type="checkbox"
							@change="mainStore.changePlace({
								entity: mainStore.currentPlace,
								change: {
									[field]: ($event.target as HTMLInputElement).checked,
								},
							})"
						/>
						{{ mainStore.t.i.inputs.checkboxCommon }}
					</label>
				</dd>
			</template>

<!-- SEC Home -->

			<template v-else-if="field === 'home' && own">
				<dd>
					<label>
						<input
							id="checkbox-homeplace"
							type="checkbox"
							:checked="
								mainStore.currentPlaceId !== null &&
								mainStore.currentPlaceId === mainStore.user?.homeplace
							"
							@change="e => {
								mainStore.setHomePlace({
									id: (e.target as HTMLInputElement).checked
										? mainStore.currentPlaceId
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

			<template v-else-if="field === 'name' || field === 'description'">
				<dt>{{ mainStore.descriptionFields[field] }}</dt>
				<dd>
					<textarea
						:ref="setInputRef(field)"
						:value="mainStore.currentPlace[field]"
						:id="'place-detailed-' + field"
						:disabled="!own"
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
							change: {
								[field]: ($event.target as HTMLTextAreaElement).value.trim(),
							},
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
import { Place } from '@/types';
import { useMainStore } from '@/stores/main';
import {
	coords2string,
	string2coords,
	iso8601ToUnixTimestamp,
	unixTimestampToISO8601,
} from '@/shared/converters';
import Images from '@/components/details/Images.vue';

const currentPlaceNameInputRef = inject<Ref<HTMLInputElement | null>>('currentPlaceNameInputRef', ref(null));
const setInputRef = (field: string) => (element: unknown) => {
	if (field === 'name') currentPlaceNameInputRef.value = element as HTMLInputElement | null;
};

const mainStore = useMainStore();

const own = computed(() =>
	mainStore.currentPlace && mainStore.currentPlace.userid === mainStore.user?.id
);
const linkEditing = ref(false);

const currentPlaceLat = computed<number | null>(() => {
	if (!mainStore.currentPlace) return null;
	return mainStore.points[mainStore.currentPlace.pointid].latitude;
});
const currentPlaceLon = computed<number | null>(() => {
	if (!mainStore.currentPlace) return null;
	return mainStore.points[mainStore.currentPlace.pointid].longitude;
});

type FieldKeys<T> = {
	[K in keyof T]: T[K] extends string | number | boolean | undefined ? K : never
}[keyof T];

type VirtualFields = 'point' | 'home';
type ValidField = (FieldKeys<Place> & keyof typeof mainStore.descriptionFields) | VirtualFields;

const orderedCurrentPlaceFields = ref<ValidField[]>([
	'name', 'description', 'point', 'link', 'time', 'srt', 'common', 'home',
]);
const currentPlaceAlt = computed<number | null | undefined>(() => {
	if (!mainStore.currentPlace) return null;
	return mainStore.points[mainStore.currentPlace.pointid].altitude;
});
const currentDegMinSec = computed(() => {
	if (!currentPlaceLat.value || !currentPlaceLon.value) return null;
	return coords2string([currentPlaceLat.value, currentPlaceLon.value]);
});
const onChangeLatitude = (e: Event) => {
	if (!mainStore.currentPlace) return;
	mainStore.changePoint({
		entity: mainStore.points[mainStore.currentPlace.pointid],
		change: { latitude: Number((e.currentTarget as HTMLInputElement).value.trim()) },
	});
};
const onChangeLongitude = (e: Event) => {
	if (!mainStore.currentPlace) return;
	mainStore.changePoint({
		entity: mainStore.points[mainStore.currentPlace.pointid],
		change: { longitude: Number((e.currentTarget as HTMLInputElement).value.trim()) },
	});
};
const onChangeCoords = (e: Event) => {
	if (!mainStore.currentPlace) return;
	const coords = string2coords((e.currentTarget as HTMLInputElement).value.trim());
	if (!coords) return;
	mainStore.changePoint({
		entity: mainStore.points[mainStore.currentPlace.pointid],
		change: {
			latitude: coords[0],
			longitude: coords[1],
		},
	});
};
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
