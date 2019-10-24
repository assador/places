<template>
	<div class="centered">
		<div class="narrower">
			<div class="brand">
				<h1 class="margin_bottom_0">Удаление аккаунта</h1>
				<p>Укажите, что делать с вашим наследием на сервисе и подтвердите удаление аккаунта</p>
			</div>
			<form @submit.prevent="accountDeletionSubmit" @click="$event.stopPropagation(); $store.commit('setIdleTime', 0);">
				<div class="account__form margin_bottom">
					<fieldset>
						<h2>Места</h2>
						<label>
							<input name="places" type="radio" v-model="leavePlaces" value="none" id="placesLeaveNone" onchange="accountDeletionConditionsChange(event);" />
							<span>Удалить все мои места</span>
						</label>
						<label>
							<input name="places" type="radio" v-model="leavePlaces" value="common" id="placesLeaveCommon" onchange="accountDeletionConditionsChange(event);" />
							<span>Оставить только видимые всем места</span>
						</label>
						<label>
							<input name="places" type="radio" v-model="leavePlaces" value="all" id="placesLeaveAll" onchange="accountDeletionConditionsChange(event);" />
							<span>Оставить все мои места, сделав их видимыми всем</span>
						</label>
					</fieldset>
					<fieldset>
						<h2>Фотографии</h2>
						<label>
							<input name="images" type="radio" v-model="leaveImages" value="none" id="imagesLeaveNone" onchange="accountDeletionConditionsChange(event);" />
							<span>Удалить мои фотографии</span>
						</label>
						<label>
							<input name="images" type="radio" v-model="leaveImages" value="all" id="imagesLeaveAll" onchange="accountDeletionConditionsChange(event);" />
							<span>Оставить мои фотографии</span>
						</label>
					</fieldset>
				</div>
				<div style="text-align: center;">
					<fieldset>
						<button type="submit">Удалить аккаунт</button>
						<button
							type="button"
							@click="$root.showPopup({show: false}, $event);"
						>
							Отмена
						</button>
					</fieldset>
				</div>
			</form>
			<div style="text-align: center;">
				<span v-html="accountDeleteMessage"></span>
			</div>
			<a
				href="javascript:void(0);"
				class="close"
				@click="$root.showPopup({show: false}, $event);"
			>
				×
			</a>
		</div>
	</div>
</template>

<script>
import { bus } from "../shared/bus.js"
import { accountDeletionRoutine } from "../shared/account.js"
export default {
	data() {
		return {
			userId: sessionStorage.getItem("places-userid"),
			leavePlaces: "none",
			leaveImages: "none",
			accountDeleteMessage: "",
		}
	},
	methods: {
		accountDeletionSubmit() {
			if(this.$store.state.user.testaccount) {
				this.accountDeleteMessage = `
					Вы авторизовались под тестовым аккаунтом,
					который удалить нельзя
				`;
			} else {
				const {
					userId,
					leavePlaces,
					leaveImages,
				} = this;
				accountDeletionRoutine({
					userId,
					leavePlaces,
					leaveImages,
				}).then(response => {
					this.accountDeleteMessage = response.message;
					bus.$emit("loggedChange", "auth");
				});
			}
		},
	},
}
</script>
