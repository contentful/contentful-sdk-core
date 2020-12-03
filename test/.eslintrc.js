module.exports = {
  extends: '../.eslintrc.js',
  globals: {
    describe: true,
    it: true,
    expect: true,
    jest: true,
    beforeEach: true,
    afterEach: true,
  },
  rules: { '@typescript-eslint/explicit-function-return-type': 'off' },
}
