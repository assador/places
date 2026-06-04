<template>
	<transition name="fade">
		<div
			v-if="props.instance.show"
			class="popup"
		>
			<div class="popup-content centered confirm">
				<div class="brand">
					<h1 class="margin_bottom_0">
						{{ mainStore.t.i.captions.sure }}
					</h1>
					<p v-if="props.instance.message">
						{{ props.instance.message }}
					</p>
				</div>
				<form
					class="confirm__form margin_bottom_0"
					@click.stop
					@submit.prevent="props.instance.accept()"
				>
					<fieldset class="confirm__form__buttons">
						<button type="submit">
							{{ mainStore.t.i.buttons.yes }}
						</button>
						<button
							type="button"
							@click="props.instance.cancel()"
						>
							{{ mainStore.t.i.buttons.cancel }}
						</button>
					</fieldset>
				</form>
				<a
					href="javascript:void(0);"
					class="close"
					@click="props.instance.cancel()"
				>
					×
				</a>
			</div>
		</div>
	</transition>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { confirm as globalConfirm, ConfirmInstance } from '@/services/confirm';
import { useMainStore } from '@/stores/main';

const props = withDefaults(defineProps<{
	instance?: ConfirmInstance,
}>(), {
	instance: () => globalConfirm,
});

const mainStore = useMainStore();

const keyup = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') props.instance.cancel();
};

onMounted(() => {
	document.addEventListener('keyup', keyup, false);
});
onUnmounted(() => {
	document.removeEventListener('keyup', keyup);
});
</script>

<style lang="scss" scoped>
.confirm {
	&__form {
		fieldset {
			margin: 1em;
		}
		&__buttons {
			display: flex;
			flex-wrap: wrap;
			gap: 8px;
			justify-content: center;
		}
	}
}
</style>
