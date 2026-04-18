<template>
	<Teleport to="#popup-root">
		<transition name="fade">
			<div
				v-if="props.show"
				v-bind="$attrs"
				ref="popupRef"
				class="popup"
				:style="style"
				@pointerup="handleInsideClick"
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
import { ref, computed, onMounted, onUnmounted, type CSSProperties } from 'vue';
import { IPopupProps } from '@/shared/interfaces';

const props = withDefaults(defineProps<IPopupProps>(), {
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

const popupRef = ref<HTMLElement | null>(null);

const close = () => {
	emit('update:show', false);
};
const handleInsideClick = () => {
	if (props.closeOnClick) close();
};
const handleClickOutside = (event: PointerEvent) => {
	if (!props.show || !popupRef.value) return;
	const target = event.target as Node;
	if ((target as HTMLElement).closest(".draggable")) return;
	if (!popupRef.value.contains(target)) close();
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
	document.addEventListener('pointerdown', handleClickOutside, false);
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
	document.removeEventListener('pointerdown', handleClickOutside, false);
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
	.popup-content .message {
		padding-right: 30px; padding-left: 30px;
		&:last-child {
			padding-bottom: 20px;
		}
	}
}
.column .popup-content {
	display: flex;
	flex-direction: column;
    gap: 32px;
}
</style>
