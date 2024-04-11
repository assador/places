<template>
	<div
		:class="'popup ' + (popuped ? 'appear' : 'disappear')"
		@click="e => close(e)"
	>
		<div class="centered">
			<div class="narrower">
				<div class="brand">
					<h1 class="margin_bottom_0">
						{{ store.state.t.i.captions.deletingAccount }}
					</h1>
					<p>{{ store.state.t.i.text.whatToDoWithAll }}</p>
				</div>
				<form
					@submit.prevent="accountDeletionSubmit();"
					@click="e => e.stopPropagation()"
				>
					<div class="account__form margin_bottom">
						<fieldset>
							<h2>
								{{ store.state.t.i.captions.places }}
							</h2>
							<label>
								<input
									id="placesLeaveNone"
									v-model="leavePlaces"
									name="places"
									type="radio"
									value="none"
									@change="e => accountDeletionConditionsChange(e)"
								>
								<span>
									{{ store.state.t.i.inputs.daDeletePlaces }}
								</span>
							</label>
							<label>
								<input
									id="placesLeaveCommon"
									v-model="leavePlaces"
									name="places"
									type="radio"
									value="common"
									@change="e => accountDeletionConditionsChange(e)"
								>
								<span>
									{{ store.state.t.i.inputs.daLeaveOnlyCommonPlaces }}
								</span>
							</label>
							<label>
								<input
									id="placesLeaveAll"
									v-model="leavePlaces"
									name="places"
									type="radio"
									value="all"
									@change="e => accountDeletionConditionsChange(e)"
								>
								<span>
									{{ store.state.t.i.inputs.daLeaveAllPlaces }}
								</span>
							</label>
						</fieldset>
						<fieldset>
							<h2>
								{{ store.state.t.i.captions.images }}
							</h2>
							<label>
								<input
									id="imagesLeaveNone"
									v-model="leaveImages"
									name="images"
									type="radio"
									value="none"
									@change="e => accountDeletionConditionsChange(e)"
								>
								<span>
									{{ store.state.t.i.inputs.daDeleteImages }}
								</span>
							</label>
							<label>
								<input
									id="imagesLeaveAll"
									v-model="leaveImages"
									name="images"
									type="radio"
									value="all"
									@change="e => accountDeletionConditionsChange(e)"
								>
								<span>
									{{ store.state.t.i.inputs.daLeaveImages }}
								</span>
							</label>
						</fieldset>
					</div>
					<div style="text-align: center;">
						<fieldset>
							<button type="submit">
								{{ store.state.t.i.buttons.deleteAccount }}
							</button>
							&#160;
							<button
								type="button"
								@click="e => close(e)"
							>
								{{ store.state.t.i.buttons.cancel }}
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
					@click="e => close(e)"
				>
					×
				</a>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUpdate } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { accountDeletionRoutine, acc } from '../shared/account';

const store = useStore();
const router = useRouter();
const route = useRoute();

const userId = ref(sessionStorage.getItem('places-userid') as string);
const leavePlaces = ref('none');
const leaveImages = ref('none');
const acc = ref(acc);
const popuped = ref(false);

onMounted(() => {
	popuped.value = true;
});
onBeforeUpdate(() => {
	popuped.value = true;
});

const close = (event?: Event): void => {
	if (event) event.stopPropagation();
	router.replace(route.matched[route.matched.length - 2].path);
};
const accountDeletionSubmit = async (): void => {
	if (store.state.user.testaccount) {
		acc.value.message = store.state.t.m.paged.taCannotBeDeleted;
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
		await store.dispatch('unload');
		router.push({name: 'PlacesAuth'});
	}
};
const accountDeletionConditionsChange = (event: Event): void => {
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
};
</script>
