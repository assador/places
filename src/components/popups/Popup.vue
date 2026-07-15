<template>
	<Teleport to="#popup-root">
		<transition name="fade">
			<div
				v-if="props.show"
				v-bind="$attrs"
				ref="popupRef"
				class="popup"
				:style="popupStyle"
				@pointerup="handleClickInside"
				@pointerdown.stop
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
import {
	ref,
	computed,
	onMounted,
	onUnmounted,
	watch,
	type CSSProperties,
} from 'vue';
import { PopupProps } from '@/types';
import { useElementSize } from '@/services/sizes';

const props = withDefaults(defineProps<PopupProps>(), {
	show: false,
	what: '',
	closeButton: true,
	closeOnClick: true,
	position: () => ({
		top: 'auto',
		right: 'auto',
		bottom: 'auto',
		left: 'auto',
	}),
});
const emit = defineEmits([ 'update:show' ]);
defineOptions({ inheritAttrs: false });

const popupRef = ref<HTMLElement | null>(null);
const { width: popupWidth, height: popupHeight } = useElementSize(popupRef, { debounceMs: 50 });

const correctedPosition = ref({
	top: 'auto',
	right: 'auto',
	bottom: 'auto',
	left: 'auto',
	maxWidth: 'none',
	maxHeight: 'none',
});

const close = () => {
	emit('update:show', false);
};
const handleClickInside = () => {
	if (props.closeOnClick) close();
};
const handleClickOutside = (event: PointerEvent) => {
	if (event.defaultPrevented || !props.show || !popupRef.value) return;
	const target = event.target as Node;
	if ((target as HTMLElement).closest('.draggable, .leaflet-marker-icon')) return;
	if (!popupRef.value.contains(target)) close();
};
const keyup = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') close();
};
const adjustPosition = () => {
	if (!popupRef.value || !props.show) return;

	const w = popupRef.value.offsetWidth;
	const h = popupRef.value.offsetHeight;
	if (!w || !h) return;

	const { clientWidth, clientHeight } = document.documentElement;
	const clientPadding = 0;

	let tString = props.position.top || 'auto';
	let lString = props.position.left || 'auto';
	let bString = props.position.bottom || 'auto';
	let rString = props.position.right || 'auto';

	let maxWidth = `${clientWidth - clientPadding * 2}px`;
	let maxHeight = `${clientHeight - clientPadding * 2}px`;

	const parsePx = (value: string) => {
		if (value.includes('calc')) {
			const match = value.match(/(\d+)\s*px/);
			return match ? parseFloat(match[1]) : null;
		}
		return value.endsWith('px') ? parseFloat(value) : null;
	}
	const t = parsePx(tString);
	const l = parsePx(lString);
	const b = parsePx(bString);
	const r = parsePx(rString);

	if (l !== null) {
		if (l + w > clientWidth - clientPadding) {
			lString = `${Math.max(clientPadding, clientWidth - w - clientPadding)}px`;
		}
	} else if (r !== null) {
		const lCalculated = clientWidth - r - w;
		if (lCalculated < clientPadding) {
			rString = `${Math.max(clientPadding, clientWidth - w - clientPadding)}px`;
		}
	}
	if (t !== null) {
		if (t + h > clientHeight - clientPadding) {
			tString = `${Math.max(clientPadding, clientHeight - h - clientPadding)}px`;
		}
	} else if (b !== null) {
		const tCalculated = clientHeight - b - h;
		if (tCalculated < clientPadding) {
			bString = `${Math.max(clientPadding, clientHeight - h - clientPadding)}px`;
		}
	}
	correctedPosition.value = {
		top: tString,
		left: lString,
		bottom: bString,
		right: rString,
		maxWidth,
		maxHeight,
	};
};
const popupStyle = computed((): CSSProperties => {
	const isReady = correctedPosition.value.maxWidth !== 'none';
	return {
		position: 'absolute',
		top: isReady ? correctedPosition.value.top : props.position.top,
		right: isReady ? correctedPosition.value.right : props.position.right,
		bottom: isReady ? correctedPosition.value.bottom : props.position.bottom,
		left: isReady ? correctedPosition.value.left : props.position.left,
		maxWidth: correctedPosition.value.maxWidth,
		maxHeight: correctedPosition.value.maxHeight,
		zIndex: 999999,
		transform: props.position.left === '50%' ? 'translateX(-50%)' : 'none',
		visibility: isReady ? 'visible' : 'hidden',
	};
});

watch([popupWidth, popupHeight, () => props.position, () => props.show], () => {
	if (props.show) adjustPosition();
}, { deep: true, flush: 'post' });

onMounted(() => {
	document.addEventListener("keyup", keyup, false);
	document.addEventListener("pointerdown", handleClickOutside, false);
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
	document.removeEventListener('pointerdown', handleClickOutside, false);
});
</script>

<style lang="scss">
.popup {
	overflow: auto !important;
}
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
