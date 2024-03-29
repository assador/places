const {
	defaults
} = require('jest-config');

module.exports = {
	preset: 'ts-jest',
	moduleFileExtensions: [
		...defaults.moduleFileExtensions,
		'ts',
		'tsx',
	],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	transform: {
		".*\\.(vue)$": "vue3-jest",
	},
	testEnvironment: 'jsdom',
};
