<template>
	<button
v-if="shown"
id="prompt-button"
class="important"
@click="installPWA"
>
		Установить как приложение
	</button>
</template>

<script setup lang="ts">
import {
	ref,
	onBeforeMount,
} from 'vue';

const shown = ref(false);
const installEvent = ref<BeforeInstallPromptEvent | null>(null);

onBeforeMount(() => {
	window.addEventListener('beforeinstallprompt', e => {
		e.preventDefault();
		installEvent.value = e;
		shown.value = true;
	});
});
const dismissPrompt = (): void => {
	shown.value = false;
};
const installPWA = (): void => {
	installEvent.value.prompt();
	installEvent.value.userChoice.then(choice => {
		dismissPrompt();
		if (choice.outcome === 'accepted') {
			// Do something additional if the user chose to install
		} else {
			// Do something additional if the user declined
		}
	});
};
</script>

<style lang="scss" scoped>
#prompt-button {
	margin-top: 18px;
}
.admin-link {
	position: relative;
	top: -10px; left: 5px;
	font-size: 55%;
	text-transform: lowercase;
}
.control-search {
	display: grid;
	grid-template-columns: 1fr auto;
	grid-column-start: 1;
	grid-column-end: 5;
	gap: 8px;
	align-items: center;
	margin: 8px 4px 4px 4px;
	input {
		width: 100%;
	}
	.actions-button {
		margin: 0;
	}
}
</style>
