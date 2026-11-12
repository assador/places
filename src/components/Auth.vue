<template>
	<div class="auth centered">
		<div class="brand">
			<h1 class="margin_bottom_0">
				{{ mainStore.t.i.brand.header }}
			</h1>
			<p>{{ mainStore.t.i.brand.slogan }}<br />{{ constants.version }}</p>
		</div>
		<Dashboard />
		<div class="auth-forms">
			<form
				ref="authLoginForm"
				class="auth-login"
				@submit.prevent="authLoginSubmit"
			>
				<h2>{{ mainStore.t.i.captions.auth }}</h2>
				<div class="auth-login-fields">
					<input
						id="auth-login-input"
						v-model.trim="authLogin"
						class="fieldwidth_100"
						required
						type="text"
						:placeholder="mainStore.t.i.inputs.regLogin"
						autofocus
					/>
					<div class="password nobr">
						<input
							id="auth-password-input"
							v-model.trim="authPassword"
							class="fieldwidth_100"
							required
							type="password"
							:placeholder="mainStore.t.i.inputs.regPassword"
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
				</div>
				<div class="buttons">
					<button type="submit">
						{{ mainStore.t.i.buttons.login }}
					</button>
					<button
						type="button"
						@click="testAuth"
					>
						{{ mainStore.t.i.buttons.try }}
					</button>
					<button
						type="button"
						onclick="document.querySelector('.auth-forgot')
							.classList.toggle('hidden');
						"
					>
						{{ mainStore.t.i.buttons.forgot }}
					</button>
				</div>
				<div v-if="login.message">
					{{ login.message }}
				</div>
			</form>
			<form
				class="auth-forgot hidden"
				@submit.prevent="authForgotSubmit"
			>
				<div>{{ mainStore.t.i.text.emailToSendPassword }}</div>
				<input
					id="forgot-email-input"
					v-model.trim="forgotEmail"
					class="fieldwidth_100"
					required
					type="text"
					placeholder="e-mail *"
				/>
				<div>
					<button type="submit">
						{{ mainStore.t.i.buttons.sendPassword }}
					</button>
				</div>
				<div v-if="forgot.message">
					{{ forgot.message }}
				</div>
			</form>
			<form
				ref="authRegForm"
				class="auth-registration"
				@submit.prevent="authRegSubmit"
			>
				<h2>{{ mainStore.t.i.captions.reg }}</h2>
				<div class="auth-registration-fields">
					<input
						id="reg-login-input"
						v-model.trim="regLogin"
						class="fieldwidth_100"
						required
						type="text"
						:placeholder="mainStore.t.i.inputs.regLogin"
						@keyup.enter="authRegSubmit"
					/>
					<input
						id="reg-name-input"
						v-model.trim="regName"
						class="fieldwidth_100"
						type="text"
						:placeholder="mainStore.t.i.inputs.regAddressBy"
						@keyup.enter="authRegSubmit"
					/>
					<div class="password nobr">
						<input
							id="reg-password-input"
							v-model.trim="regPassword"
							class="fieldwidth_100"
							required
							type="password"
							:placeholder="mainStore.t.i.inputs.regPassword"
							@keyup.enter="authRegSubmit"
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
					<div class="password nobr">
						<input
							id="reg-password-repeat-input"
							v-model.trim="regPasswordRepeat"
							class="fieldwidth_100"
							required
							type="password"
							:placeholder="mainStore.t.i.inputs.regRepeatPassword"
							@keyup.enter="authRegSubmit"
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
					<input
						id="reg-email-input"
						v-model.trim="regEmail"
						class="fieldwidth_100"
						required
						type="text"
						placeholder="e-mail *"
						@keyup.enter="authRegSubmit"
					/>
					<input
						id="reg-phone-input"
						v-model.trim="regPhone"
						class="fieldwidth_100"
						type="text"
						:placeholder="mainStore.t.i.inputs.regPhone"
						@keyup.enter="authRegSubmit"
					/>
				</div>
				<div>
					<button type="submit">
						{{ mainStore.t.i.buttons.register }}
					</button>
				</div>
				<div v-if="reg.message">
					{{ reg.message }}
				</div>
			</form>
			<div class="auth-separator" />
		</div>
		<div class="auth-footer buttons">
			<button
				:title="mainStore.t.i.hints.about"
				@click="router.push({
					name: 'AuthText',
					params: { what: 'about' },
				})"
			>
				{{ mainStore.t.i.buttons.whatIsIt }}
			</button>
			<button
				v-if="pwa?.installPWAEnabled"
				id="prompt-button"
				class="important"
				@click="pwa?.installPWA"
			>
				{{ mainStore.t.i.buttons.installPWA }}
			</button>
		</div>
		<router-view />
	</div>
	<Messages />
</template>

<script setup lang="ts">
import { ref, inject, nextTick, onMounted } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import type { usePWAInstall } from '@/shared/usepwainstall';

import { logged, loginRoutine } from '@/services/auth';
import { forgotRoutine } from '@/services/forgot';
import { regRoutine } from '@/services/reg';
import { setBusy } from '@/services/common';
import { constants } from '@/shared/constants';
import { ennobleError } from '@/shared/response';

import Dashboard from '@/components/Dashboard.vue';
import Messages from '@/components/Messages.vue';

const mainStore = useMainStore();
const router = useRouter();

const pwa = inject<ReturnType<typeof usePWAInstall>>('pwa');

const authLogin = ref('');
const authPassword = ref('');
const regLogin = ref('');
const regName = ref('');
const regPassword = ref('');
const regPasswordRepeat = ref('');
const regEmail = ref('');
const regPhone = ref('');
const forgotEmail = ref('');

const login = ref({ message: '' });
const forgot = ref({ message: '' });
const reg = ref({ message: '' });

const passwordShowHide = (input: HTMLInputElement): void => {
	input.type = input.type === 'password' ? input.type = 'text' : 'password';
}
const authLoginSubmit = async (): Promise<void> => {
	if (!authLogin.value || !authPassword.value) return;
	mainStore.setBusy(true);
	try {
		await loginRoutine({
			authLogin: authLogin.value,
			authPassword: authPassword.value,
		});
		await logged();
		router.push({ name: 'Home' });
	} catch (error) {
		login.value.message = ennobleError(error);
	} finally {
		mainStore.setBusy(false);
	}
};
const testAuth = (): void => {
	authLogin.value = authPassword.value = 'test';
	authLoginSubmit();
}
const authRegSubmit = async (): Promise<void> => {
	if (
		!regLogin.value ||
		!regPassword.value ||
		!regPasswordRepeat.value ||
		!regEmail.value
	) {
		return;
	}
	if (regPassword.value !== regPasswordRepeat.value) {
		reg.value.message = mainStore.t.m.errors.authreg.passwordsNotMatch;
		return;
	}
	try {
		await regRoutine({
			regLogin: regLogin.value,
			regPassword: regPassword.value,
			regName: regName.value,
			regEmail: regEmail.value,
			regPhone: regPhone.value,
		});
	} catch (error) {
		login.value.message = ennobleError(error);
	}
};
const authForgotSubmit = async (): Promise<void> => {
	if (document.getElementById('forgot-email-input')!.classList.contains('value_wrong')) {
		forgot.value.message = mainStore.t.m.errors.mail.incorrectEmail;
		return;
	}
	try {
		await forgotRoutine(forgotEmail.value);
	} catch (error) {
		login.value.message = ennobleError(error);
	}
};

onMounted(async () => {
	await nextTick();
	setBusy(false);
});
</script>

<style lang="scss" scoped>
.auth {
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
#dashboard {
	margin: -40px 0 40px 0;
}
.auth-forms {
	display: grid;
	grid-template-areas:
		"auth-login   auth-separator   auth-registration"
		"auth-forgot  auth-separator   auth-registration"
	;
	grid-template-columns: 1fr auto 1fr;
	gap: 20px;
	margin-bottom: 12px;
	align-items: start;
}
.auth-login, .auth-forgot, .auth-registration {
	display: grid;
	grid-template-columns: 1fr;
	gap: 12px;
	margin: 0 !important;
	align-items: start;
	h2 {
		margin-bottom: 6px !important;
	}
}
.auth-separator {
	grid-area: auth-separator;
	align-self: stretch;
	width: 1px;
	background-color: var(--color-12);
}
.auth-login {
	grid-area: auth-login;
	text-align: right;
}
.auth-forgot {
	grid-area: auth-forgot;
	text-align: right;
}
.auth-registration {
	grid-area: auth-registration;
}
.auth-login-fields, .auth-registration-fields {
	display: grid;
	grid-template-columns: 1fr;
	gap: 12px;
}
.auth-registration-fields {
	grid-template-columns: 1fr 1fr;
}
.buttons {
	display: flex;
	flex-flow: row wrap;
	gap: 12px;
	justify-content: right;
}
.auth-footer {
	margin-top: 12px;
}
@media screen and (max-width: 720px) {
	.auth {
		padding: 20px;
	}
}
@media screen and (max-width: 450px) {
	.auth-separator {
		display: none;
	}
	.auth-forms {
		display: grid;
		grid-template-areas:
			"auth-login"
			"auth-forgot"
			"auth-registration"
		;
		grid-template-columns: 1fr;
	}
	.auth-forms, .buttons {
		flex-wrap: wrap;
		justify-content: center;
	}
	.auth-login, .auth-registration {
		width: 100%;
		padding: 0;
		text-align: center;
	}
}
</style>
