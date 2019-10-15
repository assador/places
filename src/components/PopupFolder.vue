<template>
	<div>
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">Новая папка</h1>
			</div>
			<form
				class="folder-new__form margin_bottom_0"
				onclick="event.stopPropagation(); $store.commit('setIdleTime', 0);"
				@submit.prevent="appendFolder(folderName, folderDescription);"
			>
				<table class="table_form">
					<tbody>
						<tr>
							<th>Название:</th>
							<td>
								<input
									id="folderName"
									class="fieldwidth_100"
									required
									autofocus
									type="text"
									v-model="folderName"
									@click="validatable();"
								/>
							</td>
						</tr>
						<tr>
							<th>Описание:</th>
							<td>
								<textarea
									id="folderDescription"
									class="fieldwidth_100"
									v-model="folderDescription"
									@click="validatable();"
								>
								</textarea>
							</td>
						</tr>
						<tr class="back_0">
							<th></th>
							<td style="padding-top: 18px; vertical-align: top;">
								<button type="submit">Создать папку</button>
								<input
									type="button"
									value="Закрыть"
									@click="close($event);"
								/>
							</td>
						</tr>
						<tr class="back_0">
							<th></th>
							<td style="padding-top: 18px;" v-html="message"></td>
						</tr>
					</tbody>
				</table>
			</form>
			<a
				href="javascript:void(0);"
				class="close"
				@click="close($event);"
			>
				×
			</a>
		</div>
	</div>
</template>

<script>
import {constants} from "../shared/constants.js"
import axios from "axios"
export default {
	props: ["data"],
	data: function() {return {
		firstValidatable: false,
		folderName: null,
		folderDescription: null,
		message: "",
	}},
	methods: {
		validatable: function() {
			if(!this.firstValidatable) {
				make_fields_validatable();
				this.firstValidatable = true;
			}
		},
	},
	computed: {
		appendFolder: (folderName, folderDescription) => function(folderName, folderDescription) {
			let foldersCount = childrenCount(
				this.$parent.folderRoot,
				"children"
			);
			let data = new FormData();
			data.append("userid", this.$store.state.user.id);
			data.append("need", "visiting");
			axios.post("/backend/get_groups.php", data)
				.then(response => {
					if(
						constants.rights.folderscounts[response.data] < 0
						|| constants.rights.folderscounts[response.data] > foldersCount
						|| this.$store.state.user.testaccount
					) {
						let newFolder = {
							type: "folder",
							userid: sessionStorage.getItem("places-userid"),
							name: folderName,
							description: folderDescription,
							id: generateRandomString(32),
							srt: this.$store.state.folders.length > 0
								? Math.ceil(Math.max(
									...this.$store.state.folders.map(function(folder) {
										return folder.srt;
									})
								)) + 1
								: 1,
							parent: this.$store.state.currentPlace.folderid
								? this.$store.state.currentPlace.folderid
								: null,
							opened: false,
							added: true,
							deleted: false,
							updated: false,
						};
						this.$store.commit("addFolder", newFolder);
						this.message = "Папка создана";
						this.folderName = "";
						this.folderDescription = "";
						document.getElementById("folderName").focus();
					} else {
						this.message =
							'Превышено максимально допустимое для вашей ' +
							'текущей роли количство папок<br />Дождитесь ' +
							'перехода в следующую роль, или обратитесь ' +
							'к администрации сервиса по адресу<br />' +
							'<a href="mailto:' + constants.from +
							'">' + constants.from + '</a>'
						;
					}
				});
		},
		close: (event) => function(event) {
			event.stopPropagation();
			this.$root.showPopup({show: false}, event);
			this.message = "";
			this.folderName = "";
			this.folderDescription = "";
			document.getElementById("folderName").focus();
		},
	},
}
</script>
