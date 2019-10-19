<template>
	<div>
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">Экспортировать места</h1>
			</div>
			<p class="margin_bottom_0">Укажите формат файла, в который будут экспортированы места:</p>
			<form
				class="popup-export__form"
				@click="$event.stopPropagation(); $store.commit('setIdleTime', 0);"
				@submit.prevent="$root.exportPlaces($root.selectedToExport, $event.target.elements['mime'].value)"
			>
				<fieldset class="margin_bottom">
					<label>
						<input
							name="mime"
							type="radio"
							:checked="data.mime == 'application/gpx+xml'"
							value="application/gpx+xml"
						/>
						<span>GPX</span>
					</label>
					<p>
						Стандартный XML-формат хранения и обмена данными GPS.
						Понимается большинством программ-навигаторов
						(например, Locus Map, Navitel и т.д.). Экспортируются
						только сами места. Дерево папок не сохраняется.
					</p>
					<label>
						<input
							name="mime"
							type="radio"
							:checked="data.mime == 'application/json'"
							value="application/json"
						/>
						<span>JSON</span>
					</label>
					<p>
						Формат хранения и обмена произвольными данными,
						основанный на JavaScript. Идеально подходит для обмена
						данными пользователей этого сервиса. Экспортируются
						как сами места, так и деревья папок или их части.
					</p>
				</fieldset>
				<p>Выберите места для экспорта:</p>
				<div
					v-if="$store.state.places.length > 0 || $store.state.folders.length > 0"
					id="popup-export__tree"
					@click="$event.stopPropagation();"
				>
					<tree
						instanceid="popupexporttree"
						:data="$root.folderRoot || {}"
					>
					</tree>
				</div>
				<div style="text-align: center;">
					<fieldset>
						<button type="submit">Экспортировать</button>
						<button type="button" @click="$root.showPopup({show: false}, $event);">Отмена</button>
					</fieldset>
				</div>
			</form>
			<a href="javascript:void(0);" class="close" @click="$root.showPopup({show: false}, $event);">×</a>
		</div>
	</div>
</template>

<script>
import tree from "./Tree.vue"
export default {
	components: {
		tree,
	},
	props: ["data"],
	mounted: function() {
		this.$root.selectedToExport = [];
		for(let f of document.getElementById("popup-export__tree").getElementsByClassName("places-menu-folder")) {
			f.classList.add("places-menu-folder_closed");
			f.classList.remove("places-menu-folder_opened");
		}
	},
	beforeDestroy: function() {
		this.$root.selectedToExport = [];
	},
}
</script>
