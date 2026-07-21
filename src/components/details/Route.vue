<template>
	<div
		v-if="mainStore.routesShow.show && mainStore.currentRoute"
		id="route-description"
		class="margin_bottom"
	>
		<h2 class="color-01">
			{{ mainStore.t.i.captions.currentRoute }}
		</h2>
		<Points context="routes" />
		<dl
			v-for="field in orderedCurrentRouteFields"
			:key="field"
			class="route-detailed margin_bottom_0"
		>
			<template v-if="field === 'link' || field === 'srt'">
				<dt>
					<a
						v-if="
							field === 'link' &&
							!linkEditing &&
							mainStore.currentRoute[field] &&
							mainStore.currentRoute[field].trim()
						"
						:href="mainStore.currentRoute[field].trim()"
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
						:id="'route-detailed-' + field"
						:value="mainStore.currentRoute[field]"
						:type="field === 'srt' ? 'number' : 'text'"
						:disabled="!own"
						class="fieldwidth_100"
						@change="mainStore.changeRoute({
							entity: mainStore.currentRoute,
							change: {
								[field]: ($event.target as HTMLInputElement).value.trim(),
							},
						})"
					/>
				</dd>
			</template>
			<template v-else-if="field === 'time'">
				<dt>{{ mainStore.descriptionFields[field] }}:</dt>
				<dd>
					<input
						:id="'route-detailed-' + field"
						:value="unixTimestampToISO8601(mainStore.currentRoute[field])"
						type="datetime-local"
						:disabled="!own"
						class="fieldwidth_100"
						@change="mainStore.changeRoute({
							entity: mainStore.currentRoute,
							change: { [field]: iso8601ToUnixTimestamp(($event.target as HTMLInputElement).value) },
						})"
					/>
				</dd>
			</template>
			<template v-else-if="field === 'common'">
				<dd>
					<label v-if="own">
						<input
							:id="'route-detailed-' + field"
							:checked="!!mainStore.currentRoute[field]"
							type="checkbox"
							@change="mainStore.changeRoute({
								entity: mainStore.currentRoute,
								change: {
									[field]: ($event.target as HTMLInputElement).checked,
								},
							})"
						/>
						{{ mainStore.t.i.inputs.checkboxCommon }}
					</label>
				</dd>
			</template>
			<template v-else-if="field === 'name' || field === 'description'">
				<dt>{{ mainStore.descriptionFields[field] }}:</dt>
				<dd>
					<textarea
						:ref="setInputRef(field)"
						:value="mainStore.currentRoute[field]"
						:id="'route-detailed-' + field"
						:disabled="!own"
						:placeholder="
							field === 'name'
								? mainStore.t.i.inputs.routeName
								: (field === 'description'
									? mainStore.t.i.inputs.routeDescription
									: ''
								)
						"
						class="fieldwidth_100"
						@change="mainStore.changeRoute({
							entity: mainStore.currentRoute,
							change: {
								[field]: ($event.target as HTMLTextAreaElement).value.trim(),
							},
						})"
					/>
				</dd>
			</template>
		</dl>
		<div class="margin_top">
			<Images what="routes" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, inject } from 'vue';
import { Route } from '@/types'
import { useMainStore } from '@/stores/main';
import {
	iso8601ToUnixTimestamp,
	unixTimestampToISO8601,
} from '@/shared/converters';
import Points from '@/components/Points.vue';
import Images from '@/components/details/Images.vue';

const mainStore = useMainStore();

const currentRouteNameInputRef = inject<Ref<HTMLInputElement | null>>('currentRouteNameInputRef', ref(null));
const setInputRef = (field: string) => (element: unknown) => {
	if (field === 'name') currentRouteNameInputRef.value = element as HTMLInputElement | null;
};
const own = computed(() =>
	mainStore.currentRoute && mainStore.currentRoute.userid === mainStore.user?.id
);

type FieldKeys<T> = {
	[K in keyof T]: T[K] extends string | number | boolean | undefined ? K : never
}[keyof T];

type ValidField = FieldKeys<Route> & keyof typeof mainStore.descriptionFields;

const orderedCurrentRouteFields = ref<ValidField[]>([
	'name', 'description', 'link', 'time', 'srt', 'common',
]);
const linkEditing = ref(false);
</script>

<style lang="scss" scoped>
.route-detailed {
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
	.place-detailed__link-dt:last-child {
		margin-bottom: 8px;
	}
	.place-detailed__link-dt * {
		display: inline-block;
	}
	.place-detailed__link-edit {
		float: right;
	}
}
</style>
