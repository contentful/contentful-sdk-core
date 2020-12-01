module.exports = {
  overrides: [
    {
      files: '**/*.js',
      parser: 'babel-eslint',
      extends: ['standard'],
      plugins: ['standard', 'promise']
    },
    {
      files: '**/*.ts',
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended'
      ],
      plugins: ['promise']
    }
  ]
}
