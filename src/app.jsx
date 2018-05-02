const store = new Vuex.Store({
	state: {
		places: [
			{
				id: 1,
				name: 'Место 1',
				description: 'Описание места 1',
				image: '/images/image_.jpg',
				latitude: 55.8683175,
				longitude: 37.6564745,
			},
			{
				id: 2,
				name: 'Место 2',
				description: 'Описание места 2',
				image: '/images/image_.jpg',
				latitude: 55.8597648,
				longitude: 37.6375008,
			},
			{
				id: 3,
				name: 'Место 3',
				description: 'Описание места 3',
				image: '/images/image_.jpg',
				latitude: 55.8421859,
				longitude: 37.6404933,
			},
			{
				id: 4,
				name: 'Место 4',
				description: 'Описание места 4',
				image: '/images/image_.jpg',
				latitude: 55.8561935,
				longitude: 37.667199,
			},
		],
	},
});

const app = new Vue({
	el: '#app',
	template: `
		<table>
			<thead>
				<tr>
					<th>Идентификатор</th>
					<th>Название</th>
					<th>Широта</th>
					<th>Долгота</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="place in places">
					<td>{{ place.id }}</td>
					<td>{{ place.name }}</td>
					<td>{{ place.latitude }}</td>
					<td>{{ place.longitude }}</td>
				</tr>
			</tbody>
		</table>
	`,
});
