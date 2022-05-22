<template>
	<div class="auth centered">
		<div class="brand">
			<h1 class="margin_bottom_0">
				Места
			</h1>
			<p>Сервис просмотра и редактирования библиотек мест</p>
		</div>
		<div class="auth_forms">
			<div class="auth__login margin_bottom">
				<form
					class="margin_bottom"
					@submit.prevent="authLoginSubmit"
				>
					<h2>Авторизация</h2>
					<div class="auth__login__fields margin_bottom">
						<input
							id="authLogin"
							v-model.trim="authLogin"
							class="fieldwidth_100"
							required
							type="text"
							placeholder="Логин *"
						>
						<input
							id="authPassword"
							v-model.trim="authPassword"
							class="fieldwidth_100"
							required
							type="password"
							placeholder="Пароль *"
						>
					</div>
					<div class="margin_bottom">
						<button type="submit">
							Войти
						</button>
					</div>
					<div class="margin_bottom">
						{{ login.message }}
					</div>
					<button
						type="button"
						onclick="let f = document.querySelector('.auth__forgot'); if (f.classList.contains('hidden')) {f.classList.remove('hidden');} else {f.classList.add('hidden');}"
					>
						Не помню логин / пароль
					</button>
				</form>
				<form
					class="auth__forgot hidden"
					@submit.prevent="authForgot"
				>
					<p>Введите e-mail, указанный вами при регистрации. На него будут высланы ваши логин и новый пароль.</p>
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
						Прислать
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
				<h2>Регистрация</h2>
				<div class="auth__registration__fields margin_bottom">
					<input
						id="regLogin"
						v-model.trim="regLogin"
						class="fieldwidth_100"
						required
						type="text"
						placeholder="Логин *"
					>
					<input
						id="regName"
						v-model.trim="regName"
						class="fieldwidth_100"
						type="text"
						placeholder="Обращение (имя)"
					>
					<input
						id="regPassword"
						v-model.trim="regPassword"
						class="fieldwidth_100"
						required
						type="password"
						placeholder="Пароль *"
					>
					<input
						id="regPasswordRepeat"
						v-model.trim="regPasswordRepeat"
						class="fieldwidth_100"
						required
						type="password"
						placeholder="Повторите пароль *"
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
						placeholder="Телефон"
					>
				</div>
				<button
					type="submit"
					class="margin_bottom"
				>
					Зарегистрироваться
				</button>
				<div>
					{{ reg.message }}
				</div>
			</form>
		</div>
		<div>
			<button
				title="О «Местах», справка"
				@click="$router.push({name: 'AuthText', params: {what: 'about'}}).catch(() => {})"
			>
				Что это такое? Описание, мануал
			</button>
		</div>
		<router-view />
	</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState } from 'vuex'
import { makeFieldsValidatable } from '../shared/fields_validate';
import { loginRoutine, login } from '../shared/auth';
import { regRoutine, reg } from '../shared/reg';
import { forgotRoutine, forgot } from '../shared/forgot';

export default Vue.extend({
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
		}
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
					reg.message = 'Введёные пароли не совпадают';
				}
			} else {
				reg.message = 'Некоторые поля заполнены некорректно';
			}
		},
		authForgot() {
			const {forgotEmail} = this;
			if (!document.getElementById('forgotEmail')!.classList.contains('value_wrong')) {
				forgotRoutine({forgotEmail});
			} else {
				forgot.message = 'Некорректный e-mail';
			}
		},
	},
});
</script>
