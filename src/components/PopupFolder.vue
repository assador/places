<template>
	<div>
		<div class="folder-new centered">
			<div class="brand">
				<h1 class="margin_bottom_0">Новая папка</h1>
			</div>
			<form
				class="folder-new__form margin_bottom_0"
				onclick="event.stopPropagation();"
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
				<div v-html="accountDeleteMessage" style="text-align: center;"></div>
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
			let newFolder = {
				type: "folder",
				userid: localStorage.getItem("places-userid"),
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
				added: true,
				deleted: false,
				updated: false,
			};
			this.$store.commit("addFolder", newFolder);
			this.message = "Папка создана";
			this.folderName = "";
			this.folderDescription = "";
			document.getElementById("folderName").focus();
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
