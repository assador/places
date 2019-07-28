<template>
	<div class="auth centered">
		<div class="brand">
			<h1 class="margin_bottom_0">Места</h1>
			<p>Сервис просмотра и редактирования библиотек геометок</p>
		</div>
		<div class="auth_forms">
			<div class="auth__login">
				<form class="margin_bottom" @submit.prevent="authLoginSubmit">
					<h2>Авторизация</h2>
					<div class="auth__login__fields margin_bottom">
						<input
							class="fieldwidth_100"
							required
							id="authLogin"
							v-model.trim="authLogin"
							type="text"
							placeholder="Логин *"
							@click="validatable();"
						/>
						<input
							class="fieldwidth_100"
							required
							id="authPassword"
							v-model.trim="authPassword"
							type="password"
							placeholder="Пароль *"
							@click="validatable();"
						/>
					</div>
					<div class="margin_bottom"><button type="submit">Войти</button></div>
					<div v-html="loginMessage" v-if="loginMessage != ''" class="margin_bottom"></div>
					<button
						type="button"
						onclick="let f = document.querySelector('.auth__forgot'); if(f.classList.contains('hidden')) {f.classList.remove('hidden');} else {f.classList.add('hidden');}"
					>
						Не помню логин / пароль
					</button>
				</form>
				<form class="auth__forgot hidden" @submit.prevent="authForgot">
					<p>Введите e-mail, указанный вами при регистрации. На него будут высланы ваши логин и новый пароль.</p>
					<input
						class="fieldwidth_100 margin_bottom"
						required
						id="forgotEmail"
						v-model.trim="forgotEmail"
						type="text"
						placeholder="e-mail *"
						@click="validatable();"
					/>
					<button type="submit">Прислать</button>
					<div v-html="forgotMessage"></div>
				</form>
			</div>
			<form class="auth__registration" @submit.prevent="authRegSubmit">
				<h2>Регистрация</h2>
				<div class="auth__registration__fields margin_bottom">
					<input
						class="fieldwidth_100"
						required
						id="regLogin"
						v-model.trim="regLogin"
						type="text"
						placeholder="Логин *"
						@click="validatable();"
					/>
					<input
						class="fieldwidth_100"
						id="regName"
						v-model.trim="regName"
						type="text"
						placeholder="Обращение (имя)"
						@click="validatable();"
					/>
					<input
						class="fieldwidth_100"
						required
						id="regPassword"
						v-model.trim="regPassword"
						type="password"
						placeholder="Пароль *"
						@click="validatable();"
					/>
					<input
						class="fieldwidth_100"
						required
						id="regPasswordRepeat"
						v-model.trim="regPasswordRepeat"
						type="password"
						placeholder="Повторите пароль *"
						@click="validatable();"
					/>
					<input
						class="fieldwidth_100"
						required
						id="regEmail"
						v-model.trim="regEmail"
						type="text"
						placeholder="e-mail *"
						@click="validatable();"
					/>
					<input
						class="fieldwidth_100"
						id="regPhone"
						v-model.trim="regPhone"
						type="text"
						placeholder="Телефон"
						@click="validatable();"
					/>
				</div>
				<button type="submit">Зарегистрироваться</button>
				<div v-html="regMessage"></div>
			</form>
		</div>
	</div>
</template>

<script>
import {bus} from "../shared/bus.js"
import {loginRoutine} from "../shared/auth.js"
import {regRoutine} from "../shared/reg.js"
import {forgotRoutine} from "../shared/forgot.js"
export default {
	data: function() {return {
		firstValidatable: false,
		loginMessage: "",
		regMessage: "",
		forgotMessage: "",
		authLogin: "test",
		authPassword: "test",
		regLogin: "",
		regName: "",
		regPassword: "",
		regPasswordRepeat: "",
		regEmail: "",
		regPhone: "",
		forgotEmail: "",
	}},
	methods: {
		validatable: function() {
			if(!this.firstValidatable) {
				make_fields_validatable();
				this.firstValidatable = true;
			}
		},
		authLoginSubmit: function() {
			const {authLogin, authPassword} = this;
			loginRoutine({authLogin, authPassword})
				.then(response => {
					this.loginMessage = response.message;
					if(typeof response.data === "object") {
						sessionStorage.setItem("places-session", response.data.session);
						sessionStorage.setItem("places-userid", response.data.id);
						bus.$emit("loggedChange", "home");
					}
				});
		},
		authRegSubmit: function() {
			if(!document.querySelector(".value_wrong")) {
				const {regLogin, regPassword, regPasswordRepeat, regName, regEmail, regPhone} = this;
				if(regPassword === regPasswordRepeat) {
					regRoutine({regLogin, regPassword, regName, regEmail, regPhone})
						.then(response => {
							this.regMessage = response.message;
						});
				} else {
					this.regMessage = "Введёные пароли не совпадают";
				}
			} else {
				this.regMessage = "Некоторые поля заполнены некорректно";
			}
		},
		authForgot: function() {
			const {forgotEmail} = this;
			if(!document.getElementById("forgotEmail").classList.contains("value_wrong")) {
				forgotRoutine({forgotEmail})
					.then(response => {
						this.forgotMessage = response.message;
					});
			} else {
				this.forgotMessage = "Некорректный e-mail";
			}
		},
	},
}
</script>
