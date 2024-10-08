<template>
	<div class="auth centered">
		<div class="brand">
			<h1 class="margin_bottom_0">
				{{ store.state.main.t.i.brand.header }}
			</h1>
			<p>{{ store.state.main.t.i.brand.slogan }}</p>
		</div>
		<places-dashboard />
		<div class="auth_forms">
			<div class="auth__login margin_bottom">
				<form
					class="margin_bottom"
					@submit.prevent="authLoginSubmit"
				>
					<h2>{{ store.state.main.t.i.captions.auth }}</h2>
					<div class="auth__login__fields margin_bottom">
						<input
							id="authLogin"
							v-model.trim="authLogin"
							class="fieldwidth_100"
							required
							type="text"
							:placeholder="store.state.main.t.i.inputs.regLogin"
						>
						<input
							id="authPassword"
							v-model.trim="authPassword"
							class="fieldwidth_100"
							required
							type="password"
							:placeholder="store.state.main.t.i.inputs.regPassword"
						>
					</div>
					<div class="margin_bottom">
						<button type="submit">
							{{ store.state.main.t.i.buttons.login }}
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
						{{ store.state.main.t.i.buttons.forgot }}
					</button>
				</form>
				<form
					class="auth__forgot hidden"
					@submit.prevent="authForgot"
				>
					<p>{{ store.state.main.t.i.text.emailToSendPassword }}</p>
					<input
						id="forgotEmail"
						v-model.trim="forgotEmail"
						class="fieldwidth_100 margin_bottom"
						required
						type="text"
						placeholder="e-mail *"
					>
					<button
						type="submit"
						class="margin_bottom"
					>
						{{ store.state.main.t.i.buttons.sendPassword }}
					</button>
					<div>
						{{ forgot.message }}
					</div>
				</form>
			</div>
			<form
				class="auth__registration"
				@submit.prevent="authRegSubmit"
			>
				<h2>{{ store.state.main.t.i.captions.reg }}</h2>
				<div class="auth__registration__fields margin_bottom">
					<input
						id="regLogin"
						v-model.trim="regLogin"
						class="fieldwidth_100"
						required
						type="text"
						:placeholder="store.state.main.t.i.inputs.regLogin"
					>
					<input
						id="regName"
						v-model.trim="regName"
						class="fieldwidth_100"
						type="text"
						:placeholder="store.state.main.t.i.inputs.regAddressBy"
					>
					<input
						id="regPassword"
						v-model.trim="regPassword"
						class="fieldwidth_100"
						required
						type="password"
						:placeholder="store.state.main.t.i.inputs.regPassword"
					>
					<input
						id="regPasswordRepeat"
						v-model.trim="regPasswordRepeat"
						class="fieldwidth_100"
						required
						type="password"
						:placeholder="store.state.main.t.i.inputs.regRepeatPassword"
					>
					<input
						id="regEmail"
						v-model.trim="regEmail"
						class="fieldwidth_100"
						required
						type="text"
						placeholder="e-mail *"
					>
					<input
						id="regPhone"
						v-model.trim="regPhone"
						class="fieldwidth_100"
						type="text"
						:placeholder="store.state.main.t.i.inputs.regPhone"
					>
				</div>
				<button
					type="submit"
					class="margin_bottom"
				>
					{{ store.state.main.t.i.buttons.register }}
				</button>
				<div>
					{{ reg.message }}
				</div>
			</form>
		</div>
		<div>
			<button
				:title="store.state.main.t.i.hints.about"
				@click="router.push(
					{name: 'PlacesAuthText', params: {what: 'about'}}
				).catch(e => {console.error(e);})"
			>
				{{ store.state.main.t.i.buttons.whatIsIt }}
			</button>
		</div>
		<p-w-a-prompt />
		<router-view />
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUpdated } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { makeFieldsValidatable } from '@/shared/fields_validate';
import { loginRoutine, login } from '@/shared/auth';
import { regRoutine, reg } from '@/shared/reg';
import { forgotRoutine, forgot } from '@/shared/forgot';
import PlacesDashboard from './PlacesDashboard.vue';
import PWAPrompt from './PWAPrompt.vue';

const authLogin = ref('test');
const authPassword = ref('test');
const regLogin = ref('');
const regName = ref('');
const regPassword = ref('');
const regPasswordRepeat = ref('');
const regEmail = ref('');
const regPhone = ref('');
const forgotEmail = ref('');

const store = useStore();
const router = useRouter();

const authLoginSubmit = (): void => {
	loginRoutine({
		authLogin: authLogin.value,
		authPassword: authPassword.value,
	}, store.state.main.t);
};
const authRegSubmit = (): boolean => {
	if (document.querySelector('.value_wrong')) {
		reg.message = store.state.main.t.m.paged.incorrectFields;
		return false;
	}
	if (regPassword.value !== regPasswordRepeat.value) {
		reg.message = store.state.main.t.m.paged.passwordsNotMatch;
		return false;
	}
	regRoutine({
		regLogin: regLogin.value,
		regPassword: regPassword.value,
		regName: regName.value,
		regEmail: regEmail.value,
		regPhone: regPhone.value,
	}, store.state.main.t);
	return true;
};
const authForgot = (): void => {
	if (!document.getElementById('forgotEmail')!.classList.contains('value_wrong')) {
		forgotRoutine({forgotEmail: forgotEmail.value}, store.state.main.t);
	} else {
		forgot.message = store.state.main.t.m.paged.incorrectEmail;
	}
};

onMounted(() => {
	makeFieldsValidatable(store.state.main.t);
});
onUpdated(() => {
	makeFieldsValidatable(store.state.main.t);
});
</script>
