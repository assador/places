<template>
	<div class="auth centered">
		<div class="brand">
			<h1 class="margin_bottom_0">
				{{ mainStore.t.i.brand.header }}
			</h1>
			<p>{{ mainStore.t.i.brand.slogan }}<br />v6.3.2 alpha</p>
		</div>
		<Dashboard />
		<div class="auth-forms">
			<div class="auth-login margin_bottom">
				<form
					ref="authLoginForm"
					class="margin_bottom"
					@submit.prevent="authLoginSubmit"
				>
					<h2>{{ mainStore.t.i.captions.auth }}</h2>
					<div class="auth-login-fields margin_bottom">
						<input
							id="auth-login-input"
							v-model.trim="authLogin"
							class="fieldwidth_100"
							required
							type="text"
							:placeholder="
								mainStore.t.i.inputs.regLogin + ' ' +
								mainStore.t.i.inputs.authTest
							"
							autofocus
						/>
						<div class="password nobr">
							<input
								id="auth-password-input"
								v-model.trim="authPassword"
								class="fieldwidth_100"
								required
								type="password"
								:placeholder="
									mainStore.t.i.inputs.regPassword + ' ' +
									mainStore.t.i.inputs.authTest
								"
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
					<div class="margin_bottom">
						<button type="submit">
							{{ mainStore.t.i.buttons.login }}
						</button>
					</div>
					<div class="margin_bottom">
						{{ login.message }}
					</div>
					<button
						type="button"
						onclick="document.querySelector('.auth-forgot')
							.classList.toggle('hidden');
						"
					>
						{{ mainStore.t.i.buttons.forgot }}
					</button>
				</form>
				<form
					class="auth-forgot hidden"
					@submit.prevent="authForgot"
				>
					<p>{{ mainStore.t.i.text.emailToSendPassword }}</p>
					<input
						id="forgot-email-input"
						v-model.trim="forgotEmail"
						class="fieldwidth_100 margin_bottom"
						required
						type="text"
						placeholder="e-mail *"
					/>
					<button type="submit">
						{{ mainStore.t.i.buttons.sendPassword }}
					</button>
					<div class="auth-forgot-message">
						{{ forgot.message }}
					</div>
				</form>
			</div>
			<form
				ref="authRegForm"
				class="auth-registration margin_bottom"
				@submit.prevent="authRegSubmit"
			>
				<h2>{{ mainStore.t.i.captions.reg }}</h2>
				<div class="auth-registration-fields margin_bottom">
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
				<button type="submit">
					{{ mainStore.t.i.buttons.register }}
				</button>
				<div v-if="reg.message" class="margin_top">
					{{ reg.message }}
				</div>
			</form>
		</div>
		<div>
			<button
				:title="mainStore.t.i.hints.about"
				@click="router.push({name: 'AuthText', params: {what: 'about'}})"
			>
				{{ mainStore.t.i.buttons.whatIsIt }}
			</button>
		</div>
		<button
			v-if="installPWAEnabled"
			id="prompt-button"
			class="important"
			@click="installPWA"
		>
			{{ mainStore.t.i.buttons.installPWA }}
		</button>
		<router-view />
	</div>
</template>

<script setup lang="ts">
import { ref, inject, nextTick, onBeforeMount, onMounted, onUpdated } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import {
	reg,
	login,
	forgot,
	regRoutine,
	loginRoutine,
	forgotRoutine,
	makeFieldsValidatable,
} from '@/shared';
import Dashboard from '@/components/Dashboard.vue';

const mainStore = useMainStore();
const router = useRouter();

const { installPWAEnabled, installPWA } = inject('pwa') as any;

const authLogin = ref('');
const authPassword = ref('');
const regLogin = ref('');
const regName = ref('');
const regPassword = ref('');
const regPasswordRepeat = ref('');
const regEmail = ref('');
const regPhone = ref('');
const forgotEmail = ref('');

const passwordShowHide = (input: HTMLInputElement): void => {
	input.type = input.type === 'password' ? input.type = 'text' : 'password';
}
const authLoginSubmit = async () => {
	if (!authLogin.value || !authPassword.value) return;
	await loginRoutine({
		authLogin: authLogin.value,
		authPassword: authPassword.value,
	}, mainStore.t);
};
const authRegSubmit = (): boolean => {
	if (
		!regLogin.value ||
		!regPassword.value ||
		!regPasswordRepeat.value ||
		!regEmail.value
	) {
		return false;
	}
	if (document.querySelector('.value_wrong')) {
		reg.message = mainStore.t.m.paged.incorrectFields;
		return false;
	}
	if (regPassword.value !== regPasswordRepeat.value) {
		reg.message = mainStore.t.m.paged.passwordsNotMatch;
		return false;
	}
	regRoutine({
		regLogin: regLogin.value,
		regPassword: regPassword.value,
		regName: regName.value,
		regEmail: regEmail.value,
		regPhone: regPhone.value,
	}, mainStore.t);
	return true;
};
const authForgot = (): void => {
	if (!document.getElementById('forgot-email-input')!.classList.contains('value_wrong')) {
		forgotRoutine({forgotEmail: forgotEmail.value}, mainStore.t);
	} else {
		forgot.message = mainStore.t.m.paged.incorrectEmail;
	}
};
onBeforeMount(() => {
	mainStore.$reset();
});
onMounted(async () => {
	await nextTick();
	makeFieldsValidatable(mainStore.t);
});
onUpdated(async () => {
	makeFieldsValidatable(mainStore.t);
});
</script>

<style lang="scss" scoped>
.margin_bottom {
	margin-bottom: 12px !important;
}
.auth-forms {
	display: flex;
	margin-bottom: 12px;
}
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
.auth-login, .auth-registration {
	width: 50%;
}
.auth-login {
	padding-right: 20px;
	text-align: right;
}
.auth-registration {
	padding-left: 20px;
}
.auth-login-fields, .auth-registration-fields {
	display: grid;
	grid-gap: 12px;
}
.auth-registration-fields {
	grid-template-columns: 1fr 1fr;
}
.auth-forgot-message:not(:empty) {
	margin-top: 12px;
}
#dashboard {
	margin: -40px 0 40px 0;
}
#prompt-button {
	margin-top: 18px;
}
@media screen and (max-width: 720px) {
	.auth {
		padding: 20px;
	}
}
@media screen and (max-width: 450px) {
	.auth-forms {
		flex-wrap: wrap;
		justify-content: center;
	}
	.auth-login, .auth-registration {
		width: 100%;
		padding: 0;
		text-align: center;
	}
	.auth-login {
		border: none;
	}
}
</style>
