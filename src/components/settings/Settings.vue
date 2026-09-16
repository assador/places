<template>
	<div class="settings">
		<div class="app-cell">
			<Header />
			<Messages />
		</div>
		<div class="centered">
			<form
				class="settings-form"
				@submit.prevent="settingsSubmit"
			>
				<table class="table_form">
					<tbody>
						<tr class="back_0">
							<th />
							<td colspan="2">
								<Tree instanceid="settingstree" what="settings" />
							</td>
						</tr>
						<tr class="settings-form-buttons back_0">
							<th />
							<td>
								<button type="submit">
									{{ mainStore.t.i.buttons.save }}
								</button>
								<button
									type="button"
									@click="e => close(e)"
								>
									{{ mainStore.t.i.buttons.back }}
								</button>
							</td>
							<td>
								<button
									type="button"
									@click="resetUserSettings"
								>
									{{ mainStore.t.i.buttons.reset }}
								</button>
							</td>
						</tr>
					</tbody>
				</table>
			</form>
			<router-view />
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMainStore } from '@/stores/main';
import Header from '@/components/Header.vue';
import Messages from '@/components/Messages.vue';
import Tree from '@/components/tree/Tree.vue';

const mainStore = useMainStore();
const router = useRouter();

const close = (event?: Event): void => {
	if (event) event.stopPropagation();
	router.push({ name: 'Home' });
};
const resetUserSettings = (): void => {
}
const settingsSubmit = (): void => {
/* Gueards and save
	if () {
		mainStore.saveUserSettings();
	} else {
		mainStore.setMessage(mainStore.t.m.paged.incorrectFields, 3);
	}
*/
};
onMounted(() => {
	mainStore.setSettingsGroups().then(() => mainStore.trees.settings.open = true);
});
</script>

<style lang="scss" scoped>
.app-cell {
	overflow: visible;
	z-index: 1;
}
.settings {
	display: grid;
	grid-template-rows: auto 1fr;
	position: absolute;
	top: 0; right: 0; bottom: 0; left: 0;
	& > * {
		position: relative;
	}
	&-form {
		display: flex;
		width: 50%;
		fieldset {
			margin: 1em;
		}
		label {
			display: block;
		}
		&-buttons {
			td {
				padding-top: 18px;
				vertical-align: top;
				}
			th + td {
				display: flex;
				flex-wrap: wrap;
				gap: 8px;
			}
			td:last-child {
				text-align: right;
			}
		}
	}
	.button-iconed {
		right: 5px;
		margin-top: -22px;
		&:hover {
			right: 5px;
			margin-top: -22px;
			filter: brightness(130%);
		}
		&::before {
			margin-top: 0;
			transform: scale(0.8);
			background-color: var(--color-25);
		}
	}
	input[type=text] + .button-iconed::before {
		mask-image: url('@/assets/icons/eye-open-1-circled.svg');
	}
}
@media screen and (max-width: 1000px) {
	.settings-form {
		width: 75%;
	}
}
@media screen and (max-width: 800px) {
	.settings-form {
		width: 100%;
	}
}
@media screen and (max-width: 450px) {
	.centered {
		padding: 20px;
	}
}
</style>
