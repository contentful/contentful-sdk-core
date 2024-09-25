module.exports = {
  parser: '@typescript-eslint/parser',
  overrides: [
    {
      files: 'src/**/*.ts',
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 1,
      },
    },
  ],
}