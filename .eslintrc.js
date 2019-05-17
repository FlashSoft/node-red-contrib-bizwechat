module.exports = {
  "root": true,
  "parserOptions": {
    "parser": "babel-eslint",
    "sourceType": "module"
  },
  "extends": [
    "vue", "plugin:vue/recommended"
  ],
  "rules": {
    "eqeqeq": 0,
    "camelcase": 0,
    "vue/html-self-closing": 0,
    "vue/max-attributes-per-line": ["error", {
      "singleline": 8,
      "multiline": {
        "max": 1,
        "allowFirstLine": false
      }
    }],
    "vue/singleline-html-element-content-newline": 0
  }
}
