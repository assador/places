<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="close($event)"
	>
		<div class="centered">
			<div class="narrower">
				<div class="brand">
					<h1 class="margin_bottom_0">
						{{ $store.state.t.i.captions.deletingAccount }}
					</h1>
					<p>{{ $store.state.t.i.text.whatToDoWithAll }}</p>
				</div>
				<form
					@submit.prevent="accountDeletionSubmit();"
					@click="$event.stopPropagation();"
				>
					<div class="account__form margin_bottom">
						<fieldset>
							<h2>
								{{ $store.state.t.i.captions.places }}
							</h2>
							<label>
								<input
									id="placesLeaveNone"
									v-model="leavePlaces"
									name="places"
									type="radio"
									value="none"
									@change="accountDeletionConditionsChange($event);"
								>
								<span>
									{{ $store.state.t.i.inputs.daDeletePlaces }}
								</span>
							</label>
							<label>
								<input
									id="placesLeaveCommon"
									v-model="leavePlaces"
									name="places"
									type="radio"
									value="common"
									@change="accountDeletionConditionsChange($event);"
								>
								<span>
									{{ $store.state.t.i.inputs.daLeaveOnlyCommonPlaces }}
								</span>
							</label>
							<label>
								<input
									id="placesLeaveAll"
									v-model="leavePlaces"
									name="places"
									type="radio"
									value="all"
									@change="accountDeletionConditionsChange($event);"
								>
								<span>
									{{ $store.state.t.i.inputs.daLeaveAllPlaces }}
								</span>
							</label>
						</fieldset>
						<fieldset>
							<h2>
								{{ $store.state.t.i.captions.images }}
							</h2>
							<label>
								<input
									id="imagesLeaveNone"
									v-model="leaveImages"
									name="images"
									type="radio"
									value="none"
									@change="accountDeletionConditionsChange($event);"
								>
								<span>
									{{ $store.state.t.i.inputs.daDeleteImages }}
								</span>
							</label>
							<label>
								<input
									id="imagesLeaveAll"
									v-model="leaveImages"
									name="images"
									type="radio"
									value="all"
									@change="accountDeletionConditionsChange($event);"
								>
								<span>
									{{ $store.state.t.i.inputs.daLeaveImages }}
								</span>
							</label>
						</fieldset>
					</div>
					<div style="text-align: center;">
						<fieldset>
							<button type="submit">
								{{ $store.state.t.i.buttons.deleteAccount }}
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
				<div style="text-align: center;">
					{{ acc.message }}
				</div>
				<a
					href="javascript:void(0)"
					class="close"
					@click="close($event)"
				>
					×
				</a>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { accountDeletionRoutine, acc } from '../shared/account';

export default defineComponent({
	data() {
		return {
			userId: sessionStorage.getItem('places-userid') as string,
			leavePlaces: 'none',
			leaveImages: 'none',
			acc: acc,
			popuped: false,
		};
	},
	mounted() {
		this.popuped = true;
	},
	beforeUpdate() {
		this.popuped = true;
	},
	methods: {
		close(event: Event) {
			if (event) event.stopPropagation();
			this.$router.replace(
				this.$route.matched[this.$route.matched.length - 2].path
			);
		},
		accountDeletionSubmit() {
			if (this.$store.state.user.testaccount) {
				acc.message = this.$store.state.t.m.paged.taCannotBeDeleted;
			} else {
				const {
					userId,
					leavePlaces,
					leaveImages,
				} = this;
				accountDeletionRoutine(
					userId,
					leavePlaces,
					leaveImages,
				);
				this.$store.dispatch('unload');
				this.$router.push({name: 'PlacesAuth'});
			}
		},
		accountDeletionConditionsChange(event: Event) {
			switch ((event.currentTarget as Element).id) {
				case 'placesLeaveNone' :
					document.getElementById('imagesLeaveNone')!.click();
					break;
				case 'imagesLeaveAll' :
					if ((document.getElementById('placesLeaveNone') as HTMLInputElement)!.checked) {
						document.getElementById('placesLeaveCommon')!.click();
					}
					break;
			}
		},
	},
});
</script>
