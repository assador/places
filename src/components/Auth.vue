<template>
	<div class="auth centered">
		<div class="brand">
			<h1 class="margin_bottom_0">Места</h1>
			<p>Сервис просмотра и редактирования библиотек геометок</p>
		</div>
		<div class="auth_forms">
			<form class="auth__login" @submit.prevent="authLoginSubmit">
				<h2>Авторизация</h2>
				<input class="fieldwidth_100 margin_bottom" required v-model="authLogin" type="text" placeholder="Логин *" />
				<input class="fieldwidth_100 margin_bottom" required v-model="authPassword" type="password" placeholder="Пароль *" />
				<button type="submit">Войти</button>
				<div>{{ message }}</div>
			</form>
			<form class="auth__registration" @submit.prevent="regLoginSubmit">
				<h2>Регистрация</h2>
				<div class="auth__registration__fields">
					<div class="auth__registration__fields__left">
						<input class="fieldwidth_100 margin_bottom" required v-model="regLogin" type="text" placeholder="Логин *" />
						<input class="fieldwidth_100 margin_bottom" required v-model="regPassword" type="password" placeholder="Пароль *" />
						<input class="fieldwidth_100 margin_bottom" required v-model="regEmail" type="text" placeholder="e-mail *" />
					</div>
					<div class="auth__registration__fields__right">
						<input class="fieldwidth_100 margin_bottom" v-model="regName" type="text" placeholder="Обращение (имя)" />
						<input class="fieldwidth_100 margin_bottom" required v-model="regPasswordRepeat" type="password" placeholder="Повторите пароль *" />
						<input class="fieldwidth_100 margin_bottom" v-model="regPhone" type="text" placeholder="Телефон" />
					</div>
				</div>
				<button type="submit">Зарегистрироваться</button>
			</form>
		</div>
	</div>
</template>

<script>
import {bus} from "../shared/bus.js"
import {loginRoutine} from "../shared/auth.js"
export default {
	data() {return {
		message: "",
	}},
	methods: {
		authLoginSubmit: function() {
			const {authLogin, authPassword} = this;
			loginRoutine({authLogin, authPassword})
				.then(response => {
					this.message = response.message;
				});
		}
	},
}
</script>
