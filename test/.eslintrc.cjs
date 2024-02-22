module.exports = {
  extends: '../.eslintrc.cjs',
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
