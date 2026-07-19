"use strict";

const nodeGlobals = {
  __dirname: "readonly",
  __filename: "readonly",
  Buffer: "readonly",
  clearImmediate: "readonly",
  clearInterval: "readonly",
  clearTimeout: "readonly",
  console: "readonly",
  exports: "writable",
  global: "readonly",
  Intl: "readonly",
  module: "readonly",
  process: "readonly",
  queueMicrotask: "readonly",
  require: "readonly",
  setImmediate: "readonly",
  setInterval: "readonly",
  setTimeout: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
};

module.exports = [
  {
    ignores: [
      "coverage/**",
      "node_modules/**",
    ],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: nodeGlobals,
    },
    rules: {
      "no-restricted-globals": ["error", "name", "length"],
      "no-control-regex": "error",
      "no-undef": "error",
      "no-unused-vars": ["error", {caughtErrors: "none"}],
      "prefer-arrow-callback": "error",
      "quotes": ["error", "double", {allowTemplateLiterals: true}],
    },
  },
];
