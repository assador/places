import commonFunctions from '@/shared/common';

const object = {
	parent: 'HDvAVlozgwYEbIJVgvZE7JQhYQM5Oc1E',
	id: '2jmi6ciMRxs0pSVUSUBxwdROjAfeWBcf',
	name: 'Хибины',
	description: '',
	builded: true,
	srt: 3,
	geomarks: 1,
};
const tree = {
	id: 'root',
	parent: null,
	name: 'Мои места',
	description: '',
	srt: 0,
	geomarks: 1,
	builded: true,
	children: [{
		id: 'EsHS1i213EDZj2D7gl0JsA05vFFbICPB',
		parent: 'root',
		name: 'Друзья',
		description: 'Дома друзей',
		srt: 1,
		geomarks: 1,
		builded: true,
		type: 'folder',
		added: false,
		deleted: false,
		updated: false,
		opened: true,
	}, {
		id: 'nBG5TLsWKccf44h4UzUl6IznRDFfLmaY',
		parent: 'root',
		name: 'Походы',
		description: 'Походные места',
		srt: 1.5,
		geomarks: 1,
		builded: true,
		type: 'folder',
		added: false,
		deleted: false,
		updated: false,
		opened: false,
		children: [{
			id: 'fspYd0udMc1CjjSREoS38wOaUCj96NJZ',
			parent: 'nBG5TLsWKccf44h4UzUl6IznRDFfLmaY',
			name: 'Алтай',
			description: '',
			srt: 0.75,
			geomarks: 1,
			builded: true,
			children: [{
				id: '0RXjhvu7ZdEjXvID8hAXizLjC9RFSCny',
				parent: 'fspYd0udMc1CjjSREoS38wOaUCj96NJZ',
				name: 'Катунь 2008',
				description: 'Сплав по Катуни на катамаране с Бородеем, Андрюхой, Энерджайзером и Саней.',
				srt: 3.03125,
				geomarks: 1,
				builded: true,
			}],
		}, {
			id: 'HDvAVlozgwYEbIJVgvZE7JQhYQM5Oc1E',
			parent: 'nBG5TLsWKccf44h4UzUl6IznRDFfLmaY',
			name: 'Кольский п-ов',
			description: 'Кольский полуостров',
			srt: 1.5,
			geomarks: 1,
			builded: true,
			children: [{
				id: '2jmi6ciMRxs0pSVUSUBxwdROjAfeWBcf',
				parent: 'HDvAVlozgwYEbIJVgvZE7JQhYQM5Oc1E',
				name: 'Хибины',
				description: '',
				srt: 3,
				geomarks: 1,
				builded: true,
			}, {
				id: '8rICT3hwaR5jjZzzMfoZo6nJXFAWYzKt',
				parent: 'HDvAVlozgwYEbIJVgvZE7JQhYQM5Oc1E',
				name: 'Ловозёры',
				description: '',
				srt: 6,
				geomarks: 1,
				builded: true,
			}],
		}],
	}, {
		id: '36vP5nlPrl7F0nYFY08goIu6h8WQnfhg',
		parent: 'root',
		name: 'Гос. структуры',
		description: 'Отделения государственных структур',
		srt: 3.25,
		geomarks: 1,
		builded: true,
		type: 'folder',
		added: false,
		deleted: false,
		updated: false,
		opened: false,
	}, {
		id: '0hYL8cQOxG82aFYZMfgYhWVivbyM66ye',
		parent: 'root',
		name: 'Магазины',
		description: '',
		srt: 5,
		geomarks: 1,
		builded: true,
		type: 'folder',
		added: false,
		deleted: false,
		updated: false,
		opened: false,
	}, {
		id: 'BO4xIkgGi58m4J2ptfXFB9x5ZleqY9WV',
		parent: 'root',
		name: 'Работа',
		description: '',
		srt: 5,
		geomarks: 1,
		builded: true,
		type: 'folder',
		added: false,
		deleted: false,
		updated: false,
		opened: false,
	}, {
		id: '4cHwO9Qg35qK1cwN0cl2xLV74AkFOUSx',
		parent: 'root',
		name: 'Ребуха',
		description: '',
		srt: 6,
		geomarks: 1,
		builded: true,
		type: 'folder',
		added: false,
		deleted: false,
		updated: false,
		'opened': false,
	}],
};

describe('findInTree', () => {
	it('finds an object in the object tree by property value', () => {
		expect(commonFunctions.findInTree(tree, 'children', 'name', 'Хибины')).toEqual(object);
	});
});
