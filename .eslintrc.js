module.exports = {
  overrides: [
    {
      files: '**/*.js',
      parser: 'babel-eslint',
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
    },
  ],
}
