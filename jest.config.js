import { defaults } from 'jest-config';

module.exports = {
	preset: 'ts-jest',
	moduleFileExtensions: [
		...defaults.moduleFileExtensions,
		'ts',
		'tsx',
	],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		axios: 'axios/dist/node/axios.cjs',
	},
	transform: {
		".*\\.(vue)$": "vue3-jest",
	},
	testEnvironment: 'jsdom',
};
