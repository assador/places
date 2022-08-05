<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="close($event)"
	>
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">
					{{ $store.state.t.i.captions.newFolder }}
				</h1>
			</div>
			<form
				class="folder-new__form margin_bottom_0"
				@click="$event.stopPropagation();"
				@submit.prevent="appendFolder(folderName ? folderName : '', folderDescription ? folderDescription : '');"
			>
				<table class="table_form">
					<tbody>
						<tr>
							<th>{{ $store.state.t.i.captions.name }}:</th>
							<td>
								<input
									id="folderName"
									v-model="folderName"
									class="fieldwidth_100"
									required
									type="text"
								>
							</td>
						</tr>
						<tr>
							<th>{{ $store.state.t.i.captions.description }}:</th>
							<td>
								<textarea
									id="folderDescription"
									v-model="folderDescription"
									class="fieldwidth_100"
								/>
							</td>
						</tr>
						<tr class="back_0">
							<th />
							<td style="padding-top: 18px; vertical-align: top;">
								<button type="submit">
									{{ $store.state.t.i.buttons.createFolder }}
								</button>
								&#160;
								<button @click="close($event);">
									{{ $store.state.t.i.buttons.cancel }}
								</button>
							</td>
						</tr>
						<tr class="back_0">
							<th />
							<td style="padding-top: 18px;">
								{{ message }}
							</td>
						</tr>
					</tbody>
				</table>
			</form>
			<a
				href="javascript:void(0)"
				class="close"
				@click="close($event)"
			>
				×
			</a>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapState } from 'vuex';
import { constants } from '../shared/constants';
import { commonFunctions } from '../shared/common';
import { makeFieldsValidatable } from '../shared/fields_validate';
import { Folder } from '@/store/types';

export default defineComponent({
	data() {
		return {
			folderName: '',
			folderDescription: '',
			message: '',
			popuped: false,
		};
	},
	computed: {
		...mapState(['currentPlace']),
	},
	mounted() {
		this.popuped = true;
		this.$nextTick(() => {
			makeFieldsValidatable();
			document.getElementById('folderName')!.focus();
			document.addEventListener('keyup', this.keyup, false);
		});
	},
	updated() {
		makeFieldsValidatable();
	},
	beforeUnmount() {
		document.removeEventListener('keyup', this.keyup, false);
	},
	methods: {
		close(event: Event) {
			if (event) event.stopPropagation();
			this.$router.replace(
				this.$route.matched[this.$route.matched.length - 2].path
			);
		},
		appendFolder(folderName: string, folderDescription: string) {
			if (
				this.$store.state.serverConfig.rights.folderscount < 0 ||
				this.$store.state.serverConfig.rights.folderscount
					// length - 1 because there is a root folder too
					> Object.keys(this.$store.getters.treeFlat).length - 1 ||
				this.$store.state.user.testaccount
			) {
				let srt = 1;
				if (
					this.currentPlace &&
					Object.keys(
						this.$store.getters.treeFlat[
							this.currentPlace.folderid
						].children
					).length
				) {
					srt = Math.ceil(Math.max(
						...Object.keys(
							this.$store.getters.treeFlat[
								this.currentPlace.folderid
							].children
						).map(
							(id: string) =>
								this.$store.getters.treeFlat[
									this.currentPlace.folderid
								].children[id].srt
						)
					)) + 1;
				}
				const newFolder: Folder = {
					id: commonFunctions.generateRandomString(32) as string,
					parent: this.currentPlace
						? this.currentPlace.folderid
						: 'root',
					name: folderName,
					description: folderDescription,
					srt: Number(srt) || 0,
					geomarks: 1,
					builded: false,
					type: 'folder',
					added: true,
					deleted: false,
					updated: false,
					opened: false,
					userid: sessionStorage.getItem('places-userid'),
				};
				this.$store.dispatch('addFolder', {folder: newFolder});
				this.message = this.$store.state.t.m.paged.folderCreated;
				this.folderName = '';
				this.folderDescription = '';
				document.getElementById('folderName')!.focus();
			} else {
				this.message = this.$store.state.t.m.paged.foldersCountExceeded;
			}
		},
		keyup(event: Event) {
			if (
				(constants.shortcuts as Record<string, string>)
					[(event as KeyboardEvent).keyCode] === 'close'
			)  this.close(event);
		},
	},
});
</script>
