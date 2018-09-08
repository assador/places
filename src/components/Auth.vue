<template>
	<div class="auth centered">
		<div class="brand">
			<h1 class="margin_bottom_0">Места</h1>
			<p>Сервис просмотра и редактирования библиотек геометок</p>
		</div>
		<div class="auth_forms">
			<form class="auth__login" @submit.prevent="authLoginSubmit">
				<h2>Авторизация</h2>
				<input class="fieldwidth_100 margin_bottom" required id="authLogin" v-model.trim="authLogin" type="text" placeholder="Логин *" @click="validatable();" />
				<input class="fieldwidth_100 margin_bottom" required id="authPassword" v-model.trim="authPassword" type="password" placeholder="Пароль *" @click="validatable();" />
				<button type="submit" class="margin_bottom">Войти</button>
				<div v-html="loginMessage"></div>
			</form>
			<form class="auth__registration" @submit.prevent="authRegSubmit">
				<h2>Регистрация</h2>
				<div class="auth__registration__fields">
					<div class="auth__registration__fields__left">
						<input class="fieldwidth_100 margin_bottom" required id="regLogin" v-model.trim="regLogin" type="text" placeholder="Логин *" @click="validatable();" />
						<input class="fieldwidth_100 margin_bottom" required id="regPassword" v-model.trim="regPassword" type="password" placeholder="Пароль *" @click="validatable();" />
						<input class="fieldwidth_100 margin_bottom" required id="regEmail" v-model.trim="regEmail" type="text" placeholder="e-mail *" @click="validatable();" />
					</div>
					<div class="auth__registration__fields__right">
						<input class="fieldwidth_100 margin_bottom" id="regName" v-model.trim="regName" type="text" placeholder="Обращение (имя)" @click="validatable();" />
						<input class="fieldwidth_100 margin_bottom" required id="regPasswordRepeat" v-model.trim="regPasswordRepeat" type="password" placeholder="Повторите пароль *" @click="validatable();" />
						<input class="fieldwidth_100 margin_bottom" id="regPhone" v-model.trim="regPhone" type="text" placeholder="Телефон" @click="validatable();" />
					</div>
				</div>
				<button type="submit" class="margin_bottom">Зарегистрироваться</button>
				<div v-html="regMessage"></div>
			</form>
		</div>
	</div>
</template>

<script>
import {bus} from "../shared/bus.js"
import {loginRoutine} from "../shared/auth.js"
import {regRoutine} from "../shared/reg.js"
export default {
	data() {return {
		firstValidatable: false,
		loginMessage: "",
		regMessage: "",
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
						localStorage.setItem("places-session", response.data.session);
						localStorage.setItem("places-userid", response.data.id);
						this.$store.commit("setUser", response.data);
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
	},
}
</script>
