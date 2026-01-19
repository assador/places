<template>
	<div
		v-if="mainStore.tracksShow && currentTrack"
		id="track-description"
		class="margin_bottom"
	>
		<h2 class="color-01">
			{{ mainStore.t.i.captions.currentTrack }}
		</h2>
		<Points type="tracks" />
		<dl
			v-for="field in orderedCurrentTrackFields"
			:key="field"
			class="track-detailed margin_bottom_0"
		>
			<template v-if="field === 'link' || field === 'srt'">
				<dt>
					<a
						v-if="field === 'link' && !linkEditing && currentTrack[field].trim()"
						:href="currentTrack[field].trim()"
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
						:id="'track-detailed-' + field"
						v-model.number.trim="currentTrack[field]"
						:type="field === 'srt' ? 'number' : 'text'"
						:disabled="!!currentTrackCommon"
						class="fieldwidth_100"
						@change="mainStore.changeTrack({track: currentTrack, change: {[field]: currentTrack[field]}});"
					/>
				</dd>
			</template>
			<template v-else-if="field === 'time'">
				<dt>{{ mainStore.descriptionFields[field] }}:</dt>
				<dd>
					<input
						:id="'track-detailed-' + field"
						v-model="currentTrack[field]"
						type="datetime-local"
						:disabled="!!currentTrackCommon"
						class="fieldwidth_100"
						@change="mainStore.changeTrack({track: currentTrack, change: {[field]: currentTrack[field]}});"
					/>
				</dd>
			</template>
			<template v-else-if="field === 'common'" class="margin_bottom">
				<dd>
					<label v-if="!currentTrackCommon">
						<input
							:id="'track-detailed-' + field"
							v-model="currentTrack[field]"
							type="checkbox"
							:disabled="!!currentTrackCommon"
							@change="mainStore.changeTrack({track: currentTrack, change: {[field]: currentTrack[field]}});"
						/>
						{{ mainStore.t.i.inputs.checkboxCommon }}
					</label>
				</dd>
			</template>
			<template v-else>
				<dt>{{ mainStore.descriptionFields[field] }}:</dt>
				<dd>
					<textarea
						:id="'track-detailed-' + field"
						v-model.trim="currentTrack[field]"
						:disabled="!!currentTrackCommon"
						:placeholder="
							field === 'name'
								? mainStore.t.i.inputs.trackName
								: (field === 'description'
									? mainStore.t.i.inputs.trackDescription
									: ''
								)
							"
						class="fieldwidth_100"
						@change="mainStore.changeTrack({
							track: currentTrack,
							change: {[field]: currentTrack[field]}
						});"
					/>
				</dd>
			</template>
		</dl>
	</div>
</template>

<script setup lang="ts">
import { ref, Ref, computed, inject } from 'vue';
import { useMainStore } from '@/stores/main';
import Points from '@/components/Points.vue';

const currentTrackCommon = inject('currentTrackCommon') as Ref<boolean>;

const mainStore = useMainStore();

const currentTrack = computed(() => mainStore.currentTrack);

const orderedCurrentTrackFields = ref([
	'name', 'description', 'link', 'time', 'srt', 'common',
]);
const linkEditing = ref(false);
</script>

<style lang="scss" scoped>
.track-detailed {
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
