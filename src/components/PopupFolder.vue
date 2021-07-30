<template>
	<div>
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">
					Новая папка
				</h1>
			</div>
			<form
				class="folder-new__form margin_bottom_0"
				@click="$event.stopPropagation(); $store.commit('setIdleTime', 0);"
				@submit.prevent="appendFolder(folderName ? folderName : '', folderDescription ? folderDescription : '');"
			>
				<table class="table_form">
					<tbody>
						<tr>
							<th>Название:</th>
							<td>
								<input
									id="folderName"
									v-model="folderName"
									class="fieldwidth_100"
									required
									autofocus
									type="text"
								>
							</td>
						</tr>
						<tr>
							<th>Описание:</th>
							<td>
								<textarea
									id="folderDescription"
									v-model="folderDescription"
									class="fieldwidth_100"
								/>
							</td>
						</tr>
						<tr class="back_0">
							<th />
							<td style="padding-top: 18px; vertical-align: top;">
								<button type="submit">
									Создать папку
								</button>
								&#160;
								<button @click="close($event);">
									Закрыть
								</button>
							</td>
						</tr>
						<tr class="back_0">
							<th />
							<td
								style="padding-top: 18px;"
								v-html="message"
							/>
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
import { constants } from '../shared/constants'
import commonFunctions from '../shared/common'
import { makeFieldsValidatable } from '../shared/fields_validate'
import { mapState } from 'vuex'
import axios from 'axios'
export default {
	props: ["data"],
	data() {
		return {
			folderName: null,
			folderDescription: null,
			message: '',
		}
	},
	computed: {
		...mapState(['currentPlace', 'currentPlaceIndex']),
	},
	mounted() {
		makeFieldsValidatable();
		document.addEventListener('keyup', this.keyup, false);
	},
	beforeDestroy() {
		document.removeEventListener('keyup', this.keyup, false);
	},
	methods: {
		appendFolder(folderName, folderDescription) {
			let foldersCount = commonFunctions.childrenCount(
				this.$root.folderRoot,
				'children'
			);
			let data = new FormData();
			data.append('userid', this.$store.state.user.id);
			data.append('need', 'visiting');
			axios.post('/backend/get_groups.php', data)
				.then(response => {
					if (
						constants.rights.folderscounts[response.data] < 0 ||
						constants.rights.folderscounts[response.data] > foldersCount ||
						this.$store.state.user.testaccount
					) {
						let newFolder = {
							type: 'folder',
							userid: sessionStorage.getItem('places-userid'),
							name: folderName,
							description: folderDescription,
							id: commonFunctions.generateRandomString(32),
							srt: this.$store.state.folders.length > 0
								? Math.ceil(Math.max(
									...this.$store.state.folders.map(function(folder) {
										return folder.srt;
									})
								)) + 1
								: 1,
							parent: this.currentPlace.folderid
								? this.currentPlace.folderid
								: 'root',
							opened: false,
							geomarks: 1,
							added: true,
							deleted: false,
							updated: false,
						};
						this.$store.commit('addFolder', newFolder);
						this.message = 'Папка создана';
						this.folderName = '';
						this.folderDescription = "";
						document.getElementById("folderName").focus();
					} else {
						this.message = `
							Превышено максимально допустимое для вашей
							текущей роли количство папок<br />Дождитесь
							перехода в следующую роль, или обратитесь
							к администрации сервиса по адресу<br />
							<a href="mailto:
							` + constants.from + `
							">
							` + constants.from + `
							</a>'
						`;
					}
				});
		},
		close(event) {
			event.stopPropagation();
			this.$root.showPopup({show: false}, event);
			this.message = '';
			this.folderName = '';
			this.folderDescription = '';
			document.getElementById('folderName').focus();
		},
		keyup(event) {
			switch (constants.shortcuts[event.keyCode]) {
				case 'close' :
					this.$root.showPopup({show: false}, event);
					break;
			}
		},
	},
}
</script>
