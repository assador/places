<template>
	<transition name="fade">
		<div
			v-if="show"
			class="popup"
			@click.stop="close()"
		>
			<div class="popup-content centered acoount-delete">
				<div class="brand">
					<h1 class="margin_bottom_0">
						{{ mainStore.t.i.captions.deletingAccount }}
					</h1>
					<p>{{ mainStore.t.i.text.whatToDoWithAll }}:</p>
				</div>
				<form
					class="acoount-delete__form margin_bottom_0"
					@click.stop
					@submit.prevent="accountDeletionSubmit()"
				>
					<fieldset>
						<h2>
							{{ mainStore.t.i.captions.places }}
						</h2>
						<label>
							<input
								id="placesLeaveNone"
								v-model="leavePlaces"
								name="places"
								type="radio"
								value="none"
								@change="e => accountDeletionConditionsChange(e)"
							/>
							<span>
								{{ mainStore.t.i.inputs.daDeletePlaces }}
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
							/>
							<span>
								{{ mainStore.t.i.inputs.daLeaveOnlyCommonPlaces }}
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
							/>
							<span>
								{{ mainStore.t.i.inputs.daLeaveAllPlaces }}
							</span>
						</label>
					</fieldset>
					<fieldset>
						<h2>
							{{ mainStore.t.i.captions.images }}
						</h2>
						<label>
							<input
								id="imagesLeaveNone"
								v-model="leaveImages"
								name="images"
								type="radio"
								value="none"
								@change="e => accountDeletionConditionsChange(e)"
							/>
							<span>
								{{ mainStore.t.i.inputs.daDeleteImages }}
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
							/>
							<span>
								{{ mainStore.t.i.inputs.daLeaveImages }}
							</span>
						</label>
					</fieldset>
					<fieldset class="acoount-delete__form__buttons">
						<button type="submit">
							{{ mainStore.t.i.buttons.deleteAccount }}
						</button>
						<button type="button" @click="close()">
							{{ mainStore.t.i.buttons.cancel }}
						</button>
					</fieldset>
					<div class="acoount-delete__form__message">
						{{ acc.message }}
					</div>
				</form>
				<a
					href="javascript:void(0)"
					class="close"
					@click.stop="close()"
				>
					×
				</a>
			</div>
		</div>
	</transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUpdate } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { acc, accountDeletionRoutine } from '@/shared/account';

const mainStore = useMainStore();
const router = useRouter();

const leavePlaces = ref('none');
const leaveImages = ref('none');
const show = ref(false);

onMounted(() => {
	show.value = true;
});
onBeforeUpdate(() => {
	show.value = true;
});

const close = (): void => {
	router.back();
};
const accountDeletionSubmit = async () => {
	if (mainStore.user.testaccount) {
		acc.message = mainStore.t.m.paged.taCannotBeDeleted;
	} else {
		accountDeletionRoutine(
			mainStore.user.id,
			leavePlaces.value,
			leaveImages.value,
		);
		mainStore.unload();
		router.push({ name: 'Auth' });
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

<style lang="scss" scoped>
.acoount-delete {
	&__form {
		display: flex;
		flex-flow: column nowrap;
		gap: 50px;
		label {
			display: flex;
			gap: 6px;
			align-items: baseline;
		}
		&__buttons {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			justify-content: center;
		}
	}
}
</style>
