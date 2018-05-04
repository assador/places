<template>
	<div id="app" @click="showPopup(false, $event);">
		<table class="places-table">
			<thead>
				<tr>
					<th>Идентификатор</th>
					<th>Название</th>
					<th>Широта</th>
					<th>Долгота</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="place in getPlaces" :key="place.id" @click="setCurrentPlace(place.id); showPopup(true, $event);">
					<td>{{ place.id }}</td>
					<td>{{ place.name }}</td>
					<td>{{ place.latitude }}</td>
					<td>{{ place.longitude }}</td>
				</tr>
			</tbody>
		</table>
		<div id="detailed" class="popup border1 disappear" @click="function(event) {event.stopPropagation();}">
			<table class="table-wohead table-wopadd border0">
				<tbody>
					<tr>
						<th>Идентификатор:</th>
						<td>{{ Object.assign({}, detailed).id }}</td>
					</tr>
					<tr>
						<th>Название:</th>
						<td>{{ Object.assign({}, detailed).name }}</td>
					</tr>
					<tr>
						<th>Описание:</th>
						<td>{{ Object.assign({}, detailed).description }}</td>
					</tr>
					<tr>
						<th>Картинка:</th>
						<td>
							<img
								v-bind:src="Object.assign({}, detailed).image"
								v-bind:alt="Object.assign({}, detailed).name"
								v-bind:title="Object.assign({}, detailed).name"
							/>
						</td>
					</tr>
					<tr>
						<th>Широта:</th>
						<td>{{ Object.assign({}, detailed).latitude }}</td>
					</tr>
					<tr>
						<th>Долгота:</th>
						<td>{{ Object.assign({}, detailed).longitude }}</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
	props: ['detailedPlace'],
	data() {return {
		places: this.$store.state,
		detailed: this.detailedPlace,
	}},
	computed: {
		...mapGetters(['getPlaces', 'getDetailed']),
		setCurrentPlace: (p) => function(p) {this.detailed = this.getDetailed(p);},
		showPopup: (show, event) => function(show, event) {
			event.stopPropagation();
			let popup = document.getElementById("detailed");
			popup.classList.remove(show ? "disappear" : "appear");
			popup.classList.add(show ? "appear" : "disappear");
		},
	},
}
</script>
