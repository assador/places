<template>
	<div
		v-if="mainStore.routesShow && mainStore.currentRoute"
		id="route-description"
		class="margin_bottom"
	>
		<h2 class="color-01">
			{{ mainStore.t.i.captions.currentRoute }}
		</h2>
		<Points type="route" />
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
						v-model.number.trim="mainStore.currentRoute[field]"
						:type="field === 'srt' ? 'number' : 'text'"
						:disabled="!!currentRouteCommon"
						class="fieldwidth_100"
						@change="
							mainStore.changeRoute({
								route: mainStore.currentRoute,
								change: {
									[field]: mainStore.currentRoute[field],
								},
							});
						"
					/>
				</dd>
			</template>
			<template v-else-if="field === 'time'">
				<dt>{{ mainStore.descriptionFields[field] }}:</dt>
				<dd>
					<input
						:id="'route-detailed-' + field"
						v-model="mainStore.currentRoute[field]"
						type="datetime-local"
						:disabled="!!currentRouteCommon"
						class="fieldwidth_100"
						@change="
							mainStore.changeRoute({
								route: mainStore.currentRoute,
								change: {
									[field]: mainStore.currentRoute[field],
								},
							});
						"
					/>
				</dd>
			</template>
			<template v-else-if="field === 'common'" class="margin_bottom">
				<dd>
					<label v-if="!currentRouteCommon">
						<input
							:id="'route-detailed-' + field"
							v-model="mainStore.currentRoute[field]"
							type="checkbox"
							:disabled="!!currentRouteCommon"
							@change="
								mainStore.changeRoute({
									route: mainStore.currentRoute,
									change: {
										[field]: mainStore.currentRoute[field],
									},
								});
							"
						/>
						{{ mainStore.t.i.inputs.checkboxCommon }}
					</label>
				</dd>
			</template>
			<template v-else>
				<dt>{{ mainStore.descriptionFields[field] }}:</dt>
				<dd>
					<textarea
						:id="'route-detailed-' + field"
						v-model.trim="mainStore.currentRoute[field]"
						:disabled="!!currentRouteCommon"
						:placeholder="
							field === 'name'
								? mainStore.t.i.inputs.routeName
								: (field === 'description'
									? mainStore.t.i.inputs.routeDescription
									: ''
								)
							"
						class="fieldwidth_100"
						@change="
							mainStore.changeRoute({
								route: mainStore.currentRoute,
								change: {
									[field]: mainStore.currentRoute[field],
								},
							});
						"
					/>
				</dd>
			</template>
		</dl>
	</div>
</template>

<script setup lang="ts">
import { ref, Ref, inject } from 'vue';
import { useMainStore } from '@/stores/main';
import Points from '@/components/Points.vue';

const currentRouteCommon = inject('currentRouteCommon') as Ref<boolean>;

const mainStore = useMainStore();

const orderedCurrentRouteFields = ref([
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
