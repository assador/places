<template>
	<div
		class="popup"
		:class="props.show ? 'appear' : 'disappear'"
		:style="style"
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
		<slot name="slot" />
	</div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, type CSSProperties } from 'vue';
import { IPlacesPopupProps } from '@/shared';

const props = withDefaults(defineProps<IPlacesPopupProps>(), {
	show: false,
	what: '',
	closeOnClick: true,
	position: () => ({
		top: 'calc(100% + 8px)',
		right: 'auto',
		bottom: 'auto',
		left: 0,
	}),
});
const emit = defineEmits(['update:show']);

const close = (): void => {
	emit('update:show', false);
};
const keyup = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') close();
};
const style = computed((): CSSProperties  => ({
    position: 'absolute',
    top: isNaN(Number(props.position.top)) ? props.position.top : `${props.position.top}px`,
    right: isNaN(Number(props.position.right)) ? props.position.right : `${props.position.right}px`,
    bottom: isNaN(Number(props.position.bottom)) ? props.position.bottom : `${props.position.bottom}px`,
    left: isNaN(Number(props.position.left)) ? props.position.left : `${props.position.left}px`,
	zIndex: 999999,
}));

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
