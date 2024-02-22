module.exports = {
  overrides: [
    {
      files: '**/*.*js',
      parser: '@babel/eslint-parser',
      parserOptions: { plugins: ['importAttributes'], importAttributes: true },
      extends: ['standard', 'prettier'],
      plugins: ['standard', 'promise'],
    },
    {
      files: '**/*.ts',
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
      ],
      plugins: ['promise'],
      rules: {
        "@typescript-eslint/no-explicit-any": 1
      }
    },
  ],
}
