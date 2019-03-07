<template>
	<div class="account centered">
		<div class="half-width">
			<div class="brand">
				<h1 class="margin_bottom_0">Места</h1>
				<p>Страница пользователя</p>
			</div>
			<form class="account__form" @submit.prevent="accountSubmit">
				<table class="table_form">
					<tbody>
						<tr>
							<th>Логин:</th>
							<td colspan="2"><input class="fieldwidth_100" required id="accountLogin" v-model="accountLogin" type="text" placeholder="Логин *" @click="validatable();" /></td>
						</tr>
						<tr>
							<th>Новый пароль:</th>
							<td colspan="2"><input class="fieldwidth_100" id="accountNewPassword" v-model="accountNewPassword" type="password" placeholder="если нужно сменить пароль" @click="validatable();" /></td>
						</tr>
						<tr>
							<th>Повторите новый пароль:</th>
							<td colspan="2"><input class="fieldwidth_100" id="accountNewPasswordRepeat" v-model="accountNewPasswordRepeat" type="password" placeholder="если нужно сменить пароль" @click="validatable();" /></td>
						</tr>
						<tr>
							<th>Обращение (имя):</th>
							<td colspan="2"><input class="fieldwidth_100" id="accountName" v-model="accountName" type="text" placeholder="Обращение (имя)" @click="validatable();" /></td>
						</tr>
						<tr>
							<th>e-mail:</th>
							<td colspan="2"><input class="fieldwidth_100" required id="accountEmail" v-model="accountEmail" type="text" placeholder="e-mail *" @click="validatable();" /></td>
						</tr>
						<tr>
							<th>Телефон:</th>
							<td colspan="2"><input class="fieldwidth_100" id="accountPhone" v-model="accountPhone" type="text" placeholder="Телефон" @click="validatable();" /></td>
						</tr>
						<tr class="back_0">
							<th></th>
							<td style="padding-top: 18px; vertical-align: top;">
								<button type="submit">Сохранить</button>
								<button type="button" @click="back();">Назад</button>
							</td>
							<td style="padding-top: 18px; vertical-align: top; text-align: right;"><button type="button" @click="showDelete($event);">Удалить аккаунт</button></td>
						</tr>
						<tr class="back_0">
							<th></th>
							<td colspan="2" style="padding-top: 18px;" v-html="getAccountChangeMessage"></td>
						</tr>
					</tbody>
				</table>
			</form>
			<div :class="'popup ' + popuped">
				<component
					:is="popupComponent"
				>
				</component>
			</div>
		</div>
	</div>
</template>

<script>
import {constants} from "../shared/constants.js"
import {bus} from "../shared/bus.js"
import popupdelete from "./AccountDelete.vue"
import {accountSaveRoutine} from "../shared/account.js"
import {mapGetters} from "vuex"
export default {
	components: {
		popupdelete,
	},
	data() {return {
		firstValidatable: false,
		accountLogin: this.$store.state.user.login,
		accountName: this.$store.state.user.name,
		accountEmail: this.$store.state.user.email,
		accountPhone: this.$store.state.user.phone,
		popuped: "disappear",
		popupComponent: "",
	}},
	mounted: function() {
		document.addEventListener("keyup", this.keyup, false);
	},
	beforeDestroy: function() {
		document.removeEventListener("keyup", this.keyup, false);
	},
	methods: {
		validatable: function() {
			if(!this.firstValidatable) {
				make_fields_validatable();
				this.firstValidatable = true;
			}
		},
		keyup: function(event) {
			if(this.popuped == "appear" && constants.shortcuts[event.keyCode] == "close") {
				this.showPopup({show: false}, event);
			}
		},
		accountSubmit: function() {
			if(this.$store.state.user.testaccount) {
				this.$store.commit("setMessage", "Вы авторизовались под тестовым аккаунтом, который изменить нельзя");
			} else {
				if(!document.querySelector(".value_wrong")) {
					const {accountLogin, accountNewPassword, accountNewPasswordRepeat, accountName, accountEmail, accountPhone} = this;
					if(accountNewPassword === accountNewPasswordRepeat) {
						const accountId = localStorage.getItem("places-userid");
						accountSaveRoutine({accountId, accountLogin, accountNewPassword, accountName, accountEmail, accountPhone})
							.then(response => {
								if(response.data === 0) {
									bus.$emit("loggedChange", "home");
								} else {
									this.$store.commit("setMessage", response.message);
								}
							});
					} else {
						this.accountMessage = "Введёные пароли не совпадают";
					}
				} else {
					this.accountMessage = "Некоторые поля заполнены некорректно";
				}
			}
		},
	},
	computed: {
		...mapGetters(["getAccountChangeMessage"]),
		back: () => function() {
			bus.$emit("loggedChange", "home");
		},
		showPopup: (opts, event) => function(opts, event) {
			event.stopPropagation();
			switch(opts.type) {
				case "delete" :
					this.popupComponent = "popupdelete";
					break;
			}
			this.popuped = opts["show"] ? "appear" : "disappear";
		},
		showDelete: (event) => function(event) {
			this.showPopup({
				show: true,
				type: "delete",
			}, event);
		},
	},
}
</script>
