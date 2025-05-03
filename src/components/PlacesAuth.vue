<template>
	<div class="auth centered">
		<div class="brand">
			<h1 class="margin_bottom_0">
				{{ mainStore.t.i.brand.header }}
			</h1>
			<p>{{ mainStore.t.i.brand.slogan }}<br />v5.11.7</p>
		</div>
		<places-dashboard />
		<div class="auth_forms">
			<div class="auth__login margin_bottom">
				<form
					ref="authLoginForm"
					class="margin_bottom"
					@submit.prevent="authLoginSubmit"
				>
					<h2>{{ mainStore.t.i.captions.auth }}</h2>
					<div class="auth__login__fields margin_bottom">
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
							@keyup.enter="authLoginSubmit"
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
								@keyup.enter="authLoginSubmit"
							/>
							<button type="button" @click.prevent="e => {
								passwordShowHide(
									(e.target as Element)
										.previousElementSibling as HTMLInputElement
								);
							}">
								👀
							</button>
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
						onclick="document.querySelector('.auth__forgot')
							.classList.toggle('hidden');
						"
					>
						{{ mainStore.t.i.buttons.forgot }}
					</button>
				</form>
				<form
					class="auth__forgot hidden"
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
					<div>
						{{ forgot.message }}
					</div>
				</form>
			</div>
			<form
				ref="authRegForm"
				class="auth__registration margin_bottom"
				@submit.prevent="authRegSubmit"
			>
				<h2>{{ mainStore.t.i.captions.reg }}</h2>
				<div class="auth__registration__fields margin_bottom">
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
						<button type="button" @click.prevent="e => {
							passwordShowHide(
								(e.target as Element)
									.previousElementSibling as HTMLInputElement
							);
						}">
							👀
						</button>
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
						<button type="button" @click.prevent="e => {
							passwordShowHide(
								(e.target as Element)
									.previousElementSibling as HTMLInputElement
							);
						}">
							👀
						</button>
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
				<div>
					{{ reg.message }}
				</div>
			</form>
		</div>
		<div>
			<button
				:title="mainStore.t.i.hints.about"
				@click="router.push(
					{name: 'PlacesAuthText', params: {what: 'about'}}
				).catch(e => {console.error(e);})"
			>
				{{ mainStore.t.i.buttons.whatIsIt }}
			</button>
		</div>
		<p-w-a-prompt />
		<router-view />
	</div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUpdated } from 'vue';
import { useMainStore } from '@/stores/main';
import { useRouter } from 'vue-router';
import { makeFieldsValidatable } from '@/shared/fields_validate';
import { loginRoutine, login } from '@/shared/auth';
import { regRoutine, reg } from '@/shared/reg';
import { forgotRoutine, forgot } from '@/shared/forgot';
import PlacesDashboard from './PlacesDashboard.vue';
import PWAPrompt from './PWAPrompt.vue';

const mainStore = useMainStore();
const router = useRouter();

const authLoginForm = ref(null);
const authRegForm = ref(null);
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
const authLoginSubmit = (e: Event): void => {
	if (!authLogin.value || !authPassword.value) return;
	loginRoutine({
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
	if (!document.getElementById('forgotEmail')!.classList.contains('value_wrong')) {
		forgotRoutine({forgotEmail: forgotEmail.value}, mainStore.t);
	} else {
		forgot.message = mainStore.t.m.paged.incorrectEmail;
	}
};

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
.auth {
	min-width: 440px !important;
}
.auth_forms {
	display: flex;
	margin-bottom: 12px;
}
.auth__login, .auth__registration {
	width: 50%;
}
.auth__login {
	padding-right: 20px;
	text-align: right;
}
.auth__registration {
	padding-left: 20px;
}
.auth__login__fields, .auth__registration__fields {
	display: grid;
	grid-gap: 12px;
}
.auth__registration__fields {
	grid-template-columns: 1fr 1fr;
}
#dashboard {
	margin: -40px 0 40px 0;
}
@media screen and (max-width: 720px) {
	.auth {
		padding: 20px;
	}
}
</style>