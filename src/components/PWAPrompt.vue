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
