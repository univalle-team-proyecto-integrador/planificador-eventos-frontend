import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { 
    files: ["**/*.{js,mjs,cjs,jsx}"], 
    plugins: { 
      js,
      react: pluginReact // Registramos oficialmente el plugin de React aquí
    }, 
    extends: ["js/recommended"], 
    languageOptions: { 
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // Asegura el soporte completo de JSX
        },
      },
    },
    settings: {
      react: {
        version: "detect", // Soluciona la advertencia de la versión de React
      },
    },
    rules: {
      // Evita el error de 'React must be in scope' en React 17+ (JSX Transform moderno)
      "react/react-in-jsx-scope": "off",
    }
  },
  pluginReact.configs.flat.recommended,
]);