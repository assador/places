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
		'strict': 2,
		'no-unused-vars': 1,
		'@typescript-eslint/no-unused-vars': 'warn',
		'no-unused-components': 'off',
		'@typescript-eslint/no-non-null-assertion': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-empty-function': 0,
		'indent': 'off',
		'vue/html-indent': 'off',
		'no-tabs': 0,
		'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
		'vue/no-use-v-if-with-v-for': 'off',
		'vue/no-v-model-argument': 'off',
		'vue/no-multiple-template-root': 'off',
		'vue/no-v-for-template-key': 'off',
		'vue/singleline-html-element-content-newline': 'off',
		'vue/multiline-html-element-content-newline': 'off',
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
