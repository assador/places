<template>
	<Teleport to="#popup-root">
		<transition name="fade">
			<div
				v-if="props.show"
				v-bind="$attrs"
				class="popup"
				:style="style"
				@click="handleBackdropClick"
			>
				<a
					v-if="props.closeButton"
					href="javascript:void(0)"
					class="close"
					@click.stop="close()"
				>
					×
				</a>
				<div
					v-if="props.what"
					class="popup-title"
				>
					{{ props.what }}
				</div>
				<div
					class="popup-content"
				>
					<slot name="popupSlot" />
				</div>
			</div>
		</transition>
	</Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, type CSSProperties } from 'vue';
import { IPlacesPopupProps } from '@/shared';

const props = withDefaults(defineProps<IPlacesPopupProps>(), {
	show: false,
	what: '',
	closeButton: true,
	closeOnClick: true,
	position: () => ({
		top: 'calc(100% + 8px)',
		right: 'auto',
		bottom: 'auto',
		left: 0,
	}),
});
const emit = defineEmits(['update:show']);

defineOptions({
	inheritAttrs: false,
});

const close = (): void => {
	emit('update:show', false);
};
const handleBackdropClick = (e: MouseEvent) => {
	if (props.closeOnClick) {
		if ((e.target as HTMLElement).classList.contains('popup')) {
			close();
		}
	}
};
const keyup = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') close();
};
const style = computed((): CSSProperties => {
	const format = (val: string | number) => isNaN(Number(val)) ? val : `${val}px`;
	return {
		position: 'absolute',
		top: format(props.position.top),
		right: format(props.position.right || 'auto'),
		bottom: format(props.position.bottom || 'auto'),
		left: format(props.position.left),
		zIndex: 999999,
		transform: props.position.left === '50%' ? 'translateX(-50%)' : 'none',
	};
});

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
