module.exports = {
	root: true,
	env: {
		node: true,
	},
	extends: [
		'plugin:vue/recommended',
		'@vue/typescript/recommended',
	],
	rules: {
		'strict': 'off',
		'no-unused-vars': 'off',
		'@typescript-eslint/no-empty-function': 0,
		'indent': ['error', 'tab'],
		'vue/html-indent': ['error', 'tab'],
		'no-tabs': 0,
		'indent': 'off',
		'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
		'vue/no-use-v-if-with-v-for': 'off',
	},
	parserOptions: {
		ecmaVersion: 2020,
	},
	overrides: [{
		files: [
			'**/__tests__/*.{j,t}s?(x)',
			'**/tests/unit/**/*.spec.{j,t}s?(x)',
		],
		env: {
			jest: true,
		},
	}],
	settings: {
		'import/resolver': {
			'node': {
				'extensions': ['.js', '.jsx', '.ts', '.tsx'],
			},
		},
	},
}
