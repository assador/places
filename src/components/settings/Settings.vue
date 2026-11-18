<template>
	<div class="settings">
		<div class="app-cell">
			<Header />
			<Messages />
		</div>
		<div class="centered">
			<form
				class="settings-form"
				@submit.prevent="settingsSubmit"
			>
				<fieldset class="settings-tree">
					<Tree
						instanceid="settingstree"
						what="settings"
						:editable="false"
					/>
				</fieldset>
				<fieldset class="settings-form__buttons">
					<button type="submit">
						{{ mainStore.t.i.buttons.save }}
					</button>
					<button
						type="button"
						@click="e => close(e)"
					>
						{{ mainStore.t.i.buttons.back }}
					</button>
					<button
						type="button"
						:title="mainStore.t.s.extra.resetUserSettings"
						@click="mainStore.resetUserSettings()"
					>
						{{ mainStore.t.i.buttons.reset }}
					</button>
				</fieldset>
			</form>
			<router-view />
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMainStore } from '@/stores/main';
import { saveSettings } from '@/services/db';
import Header from '@/components/Header.vue';
import Messages from '@/components/Messages.vue';
import Tree from '@/components/tree/Tree.vue';

const mainStore = useMainStore();
const router = useRouter();

const close = (event?: Event): void => {
	if (event) event.stopPropagation();
	router.push({ name: 'Home' });
};
const settingsSubmit = (): void => {
	if (!mainStore.user) return;
	if (mainStore.user.testaccount) {
		mainStore.setMessage(mainStore.t.m.popup.testOnSave, 8);
	}
	saveSettings();
};
onMounted(async () => {
	await mainStore.setSettingsGroups();
	mainStore.trees.settings.open = true;
});
</script>

<style lang="scss" scoped>
.app-cell {
	overflow: visible;
	z-index: 1;
}
.settings-form {
	display: flex;
	flex-direction: column;
	gap: 20px;
	&__buttons {
		display: flex;
		gap: 8px;
		justify-content: space-between;
	}
}
.button-iconed {
	right: 5px;
	margin-top: -22px;
	&:hover {
		right: 5px;
		margin-top: -22px;
		filter: brightness(130%);
	}
	&::before {
		margin-top: 0;
		transform: scale(0.8);
		background-color: var(--color-25);
	}
}
input[type=text] + .button-iconed::before {
	mask-image: url('@/assets/icons/eye-open-1-circled.svg');
}
@media screen and (max-width: 450px) {
	.centered {
		padding: 20px;
	}
}
</style>
