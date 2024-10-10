// eslint.config.js
import typescriptEslint from "@typescript-eslint/eslint-plugin"
import jsdoc from "eslint-plugin-jsdoc"

export default [
    {
        files: ["src/**/*.js"],
        ignores: ["node_modules/**", "types/**"],
        languageOptions: {
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                project: "./jsconfig.json"
            }
        },
        plugins: {
            jsdoc,
            "@typescript-eslint": typescriptEslint
        },
        rules: {
            "jsdoc/require-param": "error",
            "jsdoc/require-returns": "error",
            "jsdoc/check-types": "error",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrors: "none"
                }
            ],
            "no-console": "off" // set to warn or error to quickly see where console.log is being used
        }
    }
]
