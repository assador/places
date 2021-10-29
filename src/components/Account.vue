<template>
	<div class="account centered">
		<div class="narrower">
			<div class="brand">
				<h1 class="margin_bottom_0">
					Места
				</h1>
				<p>Страница пользователя</p>
			</div>
			<form
				class="account__form"
				@submit.prevent="accountSubmit"
			>
				<table class="table_form">
					<tbody>
						<tr>
							<th>Логин:</th>
							<td colspan="2">
								<input
									id="accountLogin"
									v-model="accountLogin"
									class="fieldwidth_100"
									required
									type="text"
									placeholder="Логин *"
								>
							</td>
						</tr>
						<tr>
							<th>Новый пароль:</th>
							<td colspan="2">
								<input
									id="accountNewPassword"
									v-model="accountNewPassword"
									class="fieldwidth_100"
									type="password"
									placeholder="если нужно сменить пароль"
								>
							</td>
						</tr>
						<tr>
							<th>Повторите новый пароль:</th>
							<td colspan="2">
								<input
									id="accountNewPasswordRepeat"
									v-model="accountNewPasswordRepeat"
									class="fieldwidth_100"
									type="password"
									placeholder="если нужно сменить пароль"
								>
							</td>
						</tr>
						<tr>
							<th>Обращение (имя):</th>
							<td colspan="2">
								<input
									id="accountName"
									v-model="accountName"
									class="fieldwidth_100"
									type="text"
									placeholder="Обращение (имя)"
								>
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
								>
							</td>
						</tr>
						<tr>
							<th>Телефон:</th>
							<td colspan="2">
								<input
									id="accountPhone"
									v-model="accountPhone"
									class="fieldwidth_100"
									type="text"
									placeholder="Телефон"
								>
							</td>
						</tr>
						<tr class="back_0">
							<th />
							<td style="padding-top: 18px; vertical-align: top;">
								<button type="submit">
									Сохранить
								</button>
								&#160;
								<button
									type="button"
									@click="close($event)"
								>
									Назад
								</button>
							</td>
							<td style="padding-top: 18px; vertical-align: top; text-align: right;">
								<button
									type="button"
									@click="$router.push({name: 'AccountDelete'}).catch(() => {})"
								>
									Удалить аккаунт
								</button>
							</td>
						</tr>
						<tr class="back_0">
							<th />
							<td
								colspan="2"
								style="padding-top: 18px;"
							>
								{{ acc.message }}
							</td>
						</tr>
					</tbody>
				</table>
			</form>
			<router-view />
		</div>
	</div>
</template>

<script>
import { constants } from '../shared/constants'
import { bus } from '../shared/bus'
import { makeFieldsValidatable } from '../shared/fields_validate'
import { accountSaveRoutine, acc } from '../shared/account'
export default {
	data() {
		return {
			accountLogin: this.$store.state.user.login,
			accountNewPassword: null,
			accountNewPasswordRepeat: null,
			accountName: this.$store.state.user.name,
			accountEmail: this.$store.state.user.email,
			accountPhone: this.$store.state.user.phone,
			acc: acc,
		}
	},
	mounted() {
		this.$nextTick(() => {
			makeFieldsValidatable();
			document.addEventListener('keyup', this.keyup, false);
		});
	},
	updated() {
		makeFieldsValidatable();
	},
	beforeDestroy() {
		document.removeEventListener('keyup', this.keyup, false);
	},
	methods: {
		close(event) {
			if (event) event.stopPropagation();
			this.$router.push({name: 'Home'});
		},
		keyup(event) {
			if (constants.shortcuts[event.keyCode] == 'close') this.close();
		},
		accountSubmit() {
			if (this.$store.state.user.testaccount) {
				acc.message = 'Вы авторизовались под тестовым аккаунтом, который изменить нельзя';
			} else {
				if (!document.querySelector('.value_wrong')) {
					const {
						accountLogin,
						accountNewPassword,
						accountNewPasswordRepeat,
						accountName,
						accountEmail,
						accountPhone,
					} = this;
					if (accountNewPassword === accountNewPasswordRepeat) {
						const accountId = sessionStorage.getItem('places-userid');
						accountSaveRoutine({
							accountId,
							accountLogin,
							accountNewPassword,
							accountName,
							accountEmail,
							accountPhone,
						});
					} else {
						acc.message = 'Введёные пароли не совпадают';
					}
				} else {
					acc.message = 'Некоторые поля заполнены некорректно';
				}
			}
		},
	},
}
</script>
