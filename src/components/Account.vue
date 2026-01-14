<template>
	<div class="account">
		<div class="app-cell">
			<Header />
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
									id="accountLogin"
									v-model="accountLogin"
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
										id="accountNewPassword"
										v-model="accountNewPassword"
										class="fieldwidth_100"
										type="password"
										:placeholder="mainStore.t.i.inputs.needToChangePassword"
									/>
									<button
										type="button"
										class="button-iconed icon icon-eye-closed"
										@click.prevent="e => {
											passwordShowHide(
												(e.target as Element)
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
										id="accountNewPasswordRepeat"
										v-model="accountNewPasswordRepeat"
										class="fieldwidth_100"
										type="password"
										:placeholder="mainStore.t.i.inputs.needToChangePassword"
									/>
									<button
										type="button"
										class="button-iconed icon icon-eye-closed"
										@click.prevent="e => {
											passwordShowHide(
												(e.target as Element)
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
									id="accountName"
									v-model="accountName"
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
									id="accountEmail"
									v-model="accountEmail"
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
									id="accountPhone"
									v-model="accountPhone"
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
						<tr class="back_0">
							<th />
							<td
								colspan="2"
								style="padding-top: 18px;"
							>
								{{ account.message }}
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
import { ref, onMounted, onUpdated, onBeforeUnmount, nextTick } from 'vue';
import { useMainStore } from '@/stores/main';;
import { useRouter } from 'vue-router';
import { constants } from '../shared/constants';
import { makeFieldsValidatable } from '../shared/fields_validate';
import { accountSaveRoutine, acc } from '../shared/account';
import Header from './Header.vue';

const mainStore = useMainStore();
const router = useRouter();

const accountLogin = ref(mainStore.user.login);
const accountNewPassword = ref('');
const accountNewPasswordRepeat = ref('');
const accountName = ref(mainStore.user.name);
const accountEmail = ref(mainStore.user.email);
const accountPhone = ref(mainStore.user.phone);
const account = ref(acc);

onMounted(async () => {
	await nextTick();
	makeFieldsValidatable(mainStore.t);
	document.addEventListener('keyup', keyup, false);
});
onUpdated(async () => {
	makeFieldsValidatable(mainStore.t);
});
onBeforeUnmount(() => {
	document.removeEventListener('keyup', keyup, false);
});

const close = (event?: Event): void => {
	if (event) event.stopPropagation();
	router.push({name: 'Home'});
};
const keyup = (event: Event): void => {
	if (
		(constants.shortcuts as Record<string, string>)
			[(event as KeyboardEvent).code] === 'close'
	) close(event);
};
const passwordShowHide = (input: HTMLInputElement): void => {
	input.type = input.type === 'password' ? input.type = 'text' : 'password';
}
const accountSubmit = (): void => {
	if (!document.querySelector('.value_wrong')) {
		if (accountNewPassword.value === accountNewPasswordRepeat.value) {
			accountSaveRoutine({
				accountId: sessionStorage.getItem('places-useruuid') as string,
				accountLogin: accountLogin.value,
				accountNewPassword: accountNewPassword.value,
				accountName: accountName.value,
				accountEmail: accountEmail.value,
				accountPhone: accountPhone.value,
			}, mainStore.t);
		} else {
			account.value.message = mainStore.t.m.paged.passwordsNotMatch;
		}
	} else {
		account.value.message = mainStore.t.m.paged.incorrectFields;
	}
};
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
		margin-top: -20px;
		&:hover {
			right: 2px;
			margin-top: -18px;
		}
		&::before {
			margin-top: 0;
			transform: scale(1.1);
		}
	}
	input[type=text] + .button-iconed::before {
		content: url('@/assets/icons/eye-open.svg');
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
