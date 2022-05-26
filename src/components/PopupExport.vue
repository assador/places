<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="close($event)"
	>
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">
					{{ $store.state.t.i.captions.exportPlaces }}
				</h1>
			</div>
			<p class="margin_bottom_0">
				{{ $store.state.t.i.text.specifyFormatToExport }}:
			</p>
			<form
				class="popup-export__form"
				@click="$event.stopPropagation(); $store.commit('setIdleTime', 0);"
				@submit.prevent="$root.exportPlaces($root.selectedToExport, $event.target.elements['mime'].value)"
			>
				<fieldset class="margin_bottom">
					<label>
						<input
							name="mime"
							type="radio"
							:checked="mime === 'application/gpx+xml'"
							value="application/gpx+xml"
						>
						&#160;
						<span>GPX</span>
					</label>
					<p>
						{{ $store.state.t.i.text.descGpx }}
					</p>
					<label>
						<input
							name="mime"
							type="radio"
							:checked="mime === 'application/json'"
							value="application/json"
						>
						&#160;
						<span>JSON</span>
					</label>
					<p>
						{{ $store.state.t.i.text.descJson }}
					</p>
				</fieldset>
				<p>{{ $store.state.t.i.text.specifyPlacesToExport }}:</p>
				<div
					v-if="Object.keys($store.state.places).length > 0 || Object.keys($store.state.folders).length > 0"
					id="popup-export__tree"
					class="menu"
					@click="$event.stopPropagation();"
				>
					<tree
						instanceid="popupexporttree"
						:data="$store.getters.tree || {}"
					/>
				</div>
				<div style="text-align: center;">
					<fieldset>
						<button type="submit">
							{{ $store.state.t.i.buttons.export }}
						</button>
						&#160;
						<button
							type="button"
							@click="close($event)"
						>
							{{ $store.state.t.i.buttons.cancel }}
						</button>
					</fieldset>
				</div>
			</form>
			<a
				href="javascript:void(0);"
				class="close"
				@click="close($event)"
			>
				×
			</a>
		</div>
	</div>
</template>

<script lang="ts">
import Vue from 'vue';
import Tree from './Tree.vue';
import { constants } from '../shared/constants';
import { Place } from '@/store/types';

export default Vue.extend({
	components: {
		Tree,
	},
	props: ['mime'],
	data() {
		return {
			popuped: false,
		}
	},
	mounted() {
		this.popuped = true;
		(this.$root as Vue & {selectedToExport: Record<string, Place>}).selectedToExport = {};
		for (
			let f of
			document.getElementById('popup-export__tree')!
				.getElementsByClassName('folder')
		) {
			f.classList.add('folder_closed');
			f.classList.remove('folder_opened');
		}
		document.addEventListener('keyup', this.keyup, false);
	},
	beforeUpdate() {
		this.popuped = true;
	},
	beforeDestroy() {
		(this.$root as Vue & {selectedToExport: Record<string, Place>}).selectedToExport = {};
		document.removeEventListener('keyup', this.keyup, false);
	},
	methods: {
		close(event: Event) {
			if (event) event.stopPropagation();
			this.$router.replace(
				this.$route.matched[this.$route.matched.length - 2].path
			);
		},
		keyup(event: Event) {
			switch (
				(constants.shortcuts as Record<string, string>)
					[(event as KeyboardEvent).keyCode]
			) {
				case 'close' :
					this.close(event);
					break;
			}
		},
	},
});
</script>
