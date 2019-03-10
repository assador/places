<template>
	<div>
		<div class="folder-new centered">
			<div class="brand">
				<h1 class="margin_bottom_0">Удаление места</h1>
				<p>Вы действительно хотите удалить текущее место<span v-if="data.images.length > 0">, включая првязанные к нему фотографии</span>?</p>
			</div>
			<form
				class="place-delete__form margin_bottom_0"
				onclick="event.stopPropagation();"
				@submit.prevent="$parent.deletePlace(data); $parent.showPopup({show: false}, $event);"
			>
				<fieldset style="text-align: center;">
					<button type="submit">Удалить место</button>
					<button type="button" @click="$parent.showPopup({show: false}, $event);">Отмена</button>
				</fieldset>
			</form>
			<a href="javascript:void(0);" class="close" @click="$parent.showPopup({show: false}, $event);">×</a>
		</div>
	</div>
</template>

<script>
export default {
	props: ["data"],
}
</script>
