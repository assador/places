<template>
	<div class="auth centered">
		<div class="brand">
			<h1 class="margin_bottom_0">
				{{ $store.state.t.i.brand.header }}
			</h1>
			<p>{{ $store.state.t.i.brand.slogan }}</p>
		</div>
		<places-dashboard />
		<div class="auth_forms">
			<div class="auth__login margin_bottom">
				<form
					class="margin_bottom"
					@submit.prevent="authLoginSubmit"
				>
					<h2>{{ $store.state.t.i.captions.auth }}</h2>
					<div class="auth__login__fields margin_bottom">
						<input
							id="authLogin"
							v-model.trim="authLogin"
							class="fieldwidth_100"
							required
							type="text"
							:placeholder="$store.state.t.i.inputs.regLogin"
						>
						<input
							id="authPassword"
							v-model.trim="authPassword"
							class="fieldwidth_100"
							required
							type="password"
							:placeholder="$store.state.t.i.inputs.regPassword"
						>
					</div>
					<div class="margin_bottom">
						<button type="submit">
							{{ $store.state.t.i.buttons.login }}
						</button>
					</div>
					<div class="margin_bottom">
						{{ login.message }}
					</div>
					<button
						type="button"
						onclick="let f = document.querySelector('.auth__forgot'); if (f.classList.contains('hidden')) {f.classList.remove('hidden');} else {f.classList.add('hidden');}"
					>
						{{ $store.state.t.i.buttons.forgot }}
					</button>
				</form>
				<form
					class="auth__forgot hidden"
					@submit.prevent="authForgot"
				>
					<p>{{ $store.state.t.i.text.emailToSendPassword }}</p>
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
						{{ $store.state.t.i.buttons.sendPassword }}
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
				<h2>{{ $store.state.t.i.captions.reg }}</h2>
				<div class="auth__registration__fields margin_bottom">
					<input
						id="regLogin"
						v-model.trim="regLogin"
						class="fieldwidth_100"
						required
						type="text"
						:placeholder="$store.state.t.i.inputs.regLogin"
					>
					<input
						id="regName"
						v-model.trim="regName"
						class="fieldwidth_100"
						type="text"
						:placeholder="$store.state.t.i.inputs.regAddressBy"
					>
					<input
						id="regPassword"
						v-model.trim="regPassword"
						class="fieldwidth_100"
						required
						type="password"
						:placeholder="$store.state.t.i.inputs.regPassword"
					>
					<input
						id="regPasswordRepeat"
						v-model.trim="regPasswordRepeat"
						class="fieldwidth_100"
						required
						type="password"
						:placeholder="$store.state.t.i.inputs.regRepeatPassword"
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
						:placeholder="$store.state.t.i.inputs.regPhone"
					>
				</div>
				<button
					type="submit"
					class="margin_bottom"
				>
					{{ $store.state.t.i.buttons.register }}
				</button>
				<div>
					{{ reg.message }}
				</div>
			</form>
		</div>
		<div>
			<button
				:title="$store.state.t.i.hints.about"
				@click="$router.push({name: 'PlacesAuthText', params: {what: 'about'}}).catch(() => {})"
			>
				{{ $store.state.t.i.buttons.whatIsIt }}
			</button>
		</div>
		<router-view />
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import PlacesDashboard from './PlacesDashboard.vue';
import { mapState } from 'vuex'
import { makeFieldsValidatable } from '@/shared/fields_validate';
import { loginRoutine, login } from '@/shared/auth';
import { regRoutine, reg } from '@/shared/reg';
import { forgotRoutine, forgot } from '@/shared/forgot';

export default defineComponent({
	components: {
		PlacesDashboard,
	},
	data() {
		return {
			login: login,
			reg: reg,
			forgot: forgot,
			authLogin: 'test',
			authPassword: 'test',
			regLogin: '',
			regName: '',
			regPassword: '',
			regPasswordRepeat: '',
			regEmail: '',
			regPhone: '',
			forgotEmail: '',
		};
	},
	computed: {
		...mapState(['currentPlace']),
	},
	mounted() {
		this.$nextTick(() => {
			makeFieldsValidatable();
		});
	},
	updated() {
		makeFieldsValidatable();
	},
	methods: {
		authLoginSubmit() {
			const {
				authLogin,
				authPassword,
			} = this;
			loginRoutine({
				authLogin,
				authPassword,
			});
		},
		authRegSubmit() {
			if (!document.querySelector('.value_wrong')) {
				const {
					regLogin,
					regPassword,
					regPasswordRepeat,
					regName,
					regEmail,
					regPhone,
				} = this;
				if (regPassword === regPasswordRepeat) {
					regRoutine({
						regLogin,
						regPassword,
						regName,
						regEmail,
						regPhone,
					});
				} else {
					reg.message = this.$store.state.t.m.paged.passwordsNotMatch;
				}
			} else {
				reg.message = this.$store.state.t.m.paged.incorrectFields;
			}
		},
		authForgot() {
			const {forgotEmail} = this;
			if (!document.getElementById('forgotEmail')!.classList.contains('value_wrong')) {
				forgotRoutine({forgotEmail});
			} else {
				forgot.message = this.$store.state.t.m.paged.incorrectEmail;
			}
		},
	},
});
</script>
