<template>
	<div>
		<div class="popup-content centered">
			<div class="brand">
				<h1 class="margin_bottom_0">
					Экспортировать места
				</h1>
			</div>
			<p class="margin_bottom_0">
				Укажите формат файла, в который будут экспортированы места:
			</p>
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
						>
						&#160;
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
						>
						&#160;
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
					class="menu"
					@click="$event.stopPropagation();"
				>
					<tree
						instanceid="popupexporttree"
						:data="$root.folderRoot || {}"
					/>
				</div>
				<div style="text-align: center;">
					<fieldset>
						<button type="submit">
							Экспортировать
						</button>
						&#160;
						<button
							type="button"
							@click="$root.showPopup({show: false}, $event);"
						>
							Отмена
						</button>
					</fieldset>
				</div>
			</form>
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
import tree from "./Tree.vue"
import { constants } from '../shared/constants'
export default {
	components: {
		tree,
	},
	props: ["data"],
	beforeDestroy() {
		this.$root.selectedToExport = [];
	},
	mounted() {
		this.$root.selectedToExport = [];
		for(let f of document.getElementById("popup-export__tree").getElementsByClassName("folder")) {
			f.classList.add("folder_closed");
			f.classList.remove("folder_opened");
		}
		document.addEventListener('keyup', this.keyup, false);
	},
	beforeDestroy() {
		document.removeEventListener('keyup', this.keyup, false);
	},
	methods: {
		keyup(event) {
			switch(constants.shortcuts[event.keyCode]) {
				case 'close' :
					this.$root.showPopup({show: false}, event);
					break;
			}
		},
	},
}
</script>
