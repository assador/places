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
				@submit.prevent="$root.exportSelected"
			>
				<fieldset class="margin_bottom">
					<label>
						<input
							name="format"
							type="radio"
							:checked="type == 'application/json'"
							value="application/json"
						/>
						<span>JSON</span>
					</label>
					<label>
						<input
							name="format"
							type="radio"
							:checked="type == 'application/gpx+xml'"
							value="application/gpx+xml"
						/>
						<span>GPX</span>
					</label>
				</fieldset>
				<div style="text-align: center;">
					<fieldset>
						<button type="submit">Удалить папку</button>
						<button type="button" @click="$root.showPopup({show: false}, $event);">Отмена</button>
					</fieldset>
				</div>
			</form>
			<p>Выберите места для экспорта:</p>
			<div
				v-if="$store.state.places.length > 0 || $store.state.folders.length > 0"
				id="popup-export__tree"
				@click="$event.stopPropagation();"
			>
				<tree
					instanceid="popupexporttree"
					:data="$parent.folderRoot || {}"
				>
				</tree>
			</div>
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
	data: function() {return {
		type: "application/json",
		dataprop: this.data,
	}},
}
</script>
