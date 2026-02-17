import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";

export default tseslint.config(
	{
		ignores: ["**/node_modules/**", "dist/", "build/", "*.config.*"]
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	...pluginVue.configs["flat/essential"],
	{
		files: ["**/*.{js,mjs,cjs,ts,mts,cts,vue}"],
		languageOptions: {
			globals: globals.browser,
			parserOptions: {
				parser: tseslint.parser,
				extraFileExtensions: [".vue"],
				sourceType: "module",
			},
		},
		rules: {
			"no-useless-escape": "off",
			"no-irregular-whitespace": "off",
			"vue/multi-word-component-names": "off",
			"@typescript-eslint/no-explicit-any": "off",
		}
	}
);
