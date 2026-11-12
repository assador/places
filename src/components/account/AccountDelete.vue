<template>
	<transition name="fade">
		<div
			v-if="show"
			class="popup"
			@click.stop="close"
		>
			<div class="popup-content centered acoount-delete">
				<div class="brand">
					<h1>
						{{ mainStore.t.i.captions.deletingAccount }}
					</h1>
				</div>
				<form
					class="acoount-delete__form margin_bottom_0 narrower"
					@click.stop
					@submit.prevent="accountDeletionSubmit"
				>
					<fieldset class="acoount-delete__form__warning">
						<p>{{ mainStore.t.i.text.permanentlyDeleteAccount }}</p>
						<p><strong>{{ mainStore.t.i.text.irreversibleAction }}</strong></p>
					</fieldset>
					<fieldset class="acoount-delete__form__buttons">
						<button type="submit">
							{{ mainStore.t.i.buttons.deleteAccount }}
						</button>
						<button type="button" @click="close()">
							{{ mainStore.t.i.buttons.cancel }}
						</button>
					</fieldset>
				</form>
				<button
					class="link close"
					@click.stop="close"
				>
					×
				</button>
			</div>
		</div>
	</transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { accountDeletionRoutine } from '@/services/account';
import { ennobleError } from '@/shared/response';

const mainStore = useMainStore();
const router = useRouter();

const leavePlaces = ref('none');
const leaveImages = ref('none');
const show = ref(false);

onMounted(() => {
	show.value = true;
});

const close = (): void => {
	router.back();
};
const accountDeletionSubmit = async (): Promise<void> => {
	if (!mainStore.user) return;
	if (mainStore.user.testaccount) {
		mainStore.setMessage(mainStore.t.m.errors.authreg.taCannotBeDeleted, 3);
		return;
	}
	try {
		await accountDeletionRoutine(
			mainStore.user.id,
			leavePlaces.value,
			leaveImages.value,
		);
		mainStore.unload();
		mainStore.setMessage(mainStore.t.m.response.success.ok);
		router.push({ name: 'Auth' });
	} catch (error) {
		mainStore.setMessage(ennobleError(error));
	}
};
</script>

<style lang="scss" scoped>
.acoount-delete {
	&__form {
		display: flex;
		flex-flow: column nowrap;
		gap: 50px;
		&__warning {
			text-align: center;
		}
		&__buttons {
			display: flex;
			flex-wrap: wrap;
			gap: 20px;
			justify-content: space-between;
		}
	}
}
</style>
