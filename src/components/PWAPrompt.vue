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
	inject,
	watch,
} from 'vue';

const installEvent = inject<typeof installEvent>('installEvent');
const shown = ref(false);
watch(() => installEvent.value, () => {
	shown.value = !!installEvent.value;
});

const dismissPrompt = (): void => {
	shown.value = false;
};
const installPWA = (): void => {
	installEvent.value.prompt();
	installEvent.value.userChoice.then(choice => {
		dismissPrompt();
		if (choice.outcome === 'accepted') {
		} else {
		}
	});
};
</script>

<style lang="scss" scoped>
#prompt-button {
	margin-top: 18px;
}
</style>
