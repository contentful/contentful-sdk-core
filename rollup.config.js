const esmConfig = {
  input: 'dist/esm-raw/index.js',
  output: {
    dir: 'dist/esm',
    format: 'esm',
    preserveModules: true,
  },
}

const cjsConfig = {
  input: 'dist/esm-raw/index.js',
  output: {
    dir: 'dist/cjs',
    format: 'cjs',
    preserveModules: true,
    entryFileNames: '[name].cjs',
  },
}

export default [esmConfig, cjsConfig]
