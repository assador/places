<template>
	<transition name="fade">
		<div
			v-if="mainStore.messages.length || mainStore.messagesMouseOver"
			id="messages"
			@mouseenter="mainStore.messagesMouseOver = true"
			@mouseleave="() => {
				mainStore.messagesMouseOver = false;
				mainStore.clearMessages();
			}"
			@click="mainStore.clearMessages(true)"
		>
			<div
				v-for="(message, index) in mainStore.messages"
				:id="'message-' + index"
				:key="'message-' + index"
				class="message border_1"
			>
				{{ message }}
			</div>
		</div>
	</transition>
</template>

<script setup lang="ts">
import { useMainStore } from '@/stores/main';

const mainStore = useMainStore();
</script>

<style lang="scss" scoped>
</style>
