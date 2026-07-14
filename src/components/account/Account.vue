<template>
	<div class="account">
		<div class="app-cell">
			<Header />
			<Messages />
		</div>
		<div class="centered">
			<h2>{{ mainStore.t.i.captions.accountPage }}</h2>
			<form
				class="account-form"
				@submit.prevent="accountSubmit"
			>
				<table class="table_form">
					<tbody>
						<tr>
							<th>{{ mainStore.t.i.captions.login }}:</th>
							<td colspan="2">
								<input
									v-model="account.login"
									class="fieldwidth_100"
									required
									type="text"
									:placeholder="mainStore.t.i.inputs.regLogin"
								/>
							</td>
						</tr>
						<tr>
							<th>{{ mainStore.t.i.captions.newPassword }}:</th>
							<td colspan="2">
								<div class="password nobr">
									<input
										v-model="account.passwordnew"
										class="fieldwidth_100"
										type="password"
										:placeholder="mainStore.t.i.inputs.needToChangePassword"
									/>
									<button
										type="button"
										class="button-iconed icon icon-eye-closed-circled"
										@click.prevent="e => {
											passwordShowHide(
												(e.currentTarget as HTMLElement)
													.previousElementSibling as HTMLInputElement
											);
										}"
									/>
								</div>
							</td>
						</tr>
						<tr>
							<th>{{ mainStore.t.i.captions.repeatPassword }}:</th>
							<td colspan="2">
								<div class="password nobr">
									<input
										v-model="account.passwordnewrepeat"
										class="fieldwidth_100"
										type="password"
										:placeholder="mainStore.t.i.inputs.needToChangePassword"
									/>
									<button
										type="button"
										class="button-iconed icon icon-eye-closed-circled"
										@click.prevent="e => {
											passwordShowHide(
												(e.currentTarget as HTMLElement)
													.previousElementSibling as HTMLInputElement
											);
										}"
									/>
								</div>
							</td>
						</tr>
						<tr>
							<th>{{ mainStore.t.i.inputs.regAddressBy }}:</th>
							<td colspan="2">
								<input
									v-model="account.name"
									class="fieldwidth_100"
									type="text"
									:placeholder="mainStore.t.i.inputs.regAddressBy"
								/>
							</td>
						</tr>
						<tr>
							<th>e-mail:</th>
							<td colspan="2">
								<input
									v-model="account.email"
									class="fieldwidth_100"
									required
									type="text"
									placeholder="e-mail *"
								/>
							</td>
						</tr>
						<tr>
							<th>{{ mainStore.t.i.captions.phone }}:</th>
							<td colspan="2">
								<input
									v-model="account.phone"
									class="fieldwidth_100"
									type="text"
									:placeholder="mainStore.t.i.captions.phone"
								/>
							</td>
						</tr>
						<tr class="account-form-buttons back_0">
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
									@click="router.push({name: 'AccountDelete'})"
								>
									{{ mainStore.t.i.buttons.deleteAccount }}
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
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useMainStore } from '@/stores/main';
import { Account } from '@/types';
import { isAccount } from '@/guards';
import { accountSaveRoutine } from '@/shared/account';
import Header from '@/components/Header.vue';
import Messages from '@/components/Messages.vue';

const mainStore = useMainStore();
const router = useRouter();

const account = ref<Partial<Account>>({
	...mainStore.user,
	passwordnew: '',
	passwordnewrepeat: '',
});

const close = (event?: Event): void => {
	if (event) event.stopPropagation();
	router.push({ name: 'Home' });
};
const keyup = (event: KeyboardEvent): void => {
	if (event.key === 'Escape') close(event);
};
const passwordShowHide = (input: HTMLInputElement): void => {
	input.type = input.type === 'password' ? input.type = 'text' : 'password';
}
const accountSubmit = (): void => {
	if (isAccount(account.value)) {
		accountSaveRoutine(account.value);
	} else {
		console.log('asdfasd');
		mainStore.setMessage(mainStore.t.m.paged.incorrectFields, 3);
	}
};

onMounted(async () => {
	await nextTick();
	document.addEventListener('keyup', keyup, false);
});
onBeforeUnmount(() => {
	document.removeEventListener('keyup', keyup, false);
});
</script>

<style lang="scss" scoped>
.app-cell {
	overflow: visible;
	z-index: 1;
}
.account {
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
	.account-form {
		width: 75%;
	}
}
@media screen and (max-width: 800px) {
	.account-form {
		width: 100%;
	}
}
@media screen and (max-width: 450px) {
	.centered {
		padding: 20px;
	}
}
</style>
