<template>
	<div
		:class="'popup ' + (props.show ? 'appear' : 'disappear')"
		@click="() => {if (closeOnClick) close();}"
	>
		<a
			href="javascript:void(0)"
			class="close"
			@click="close()"
		>
			×
		</a>
		{{ props.what }}
		<slot name="slot"></slot>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { constants } from '@/shared/constants';

export interface IPlacesPopupProps {
	show: boolean;
	what?: any;
	closeOnClick?: boolean;
}
const props = withDefaults(defineProps<IPlacesPopupProps>(), {
	show: false,
	what: '',
	closeOnClick: true,
});
const emit = defineEmits(['update:show']);

const close = (): void => {
	emit('update:show', false);
};
const keyup = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') close();
};

onMounted(() => {
	document.addEventListener('keyup', keyup, false);
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
});
</script>

<style lang="scss">
.popup.messages {
	display: block;
	top: calc(100% + 8px); right: auto; bottom: auto; left: 0;
	padding: 30px 0 0 0;
	.close {
		right: 0;
		padding: 15px 11px;
		& + .message {
			border-top: none;
		}
	}
	.message {
		padding-right: 30px; padding-left: 30px;
		&:last-child {
			padding-bottom: 20px;
		}
	}
}
</style>
