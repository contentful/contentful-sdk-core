import typescript from '@rollup/plugin-typescript'
import sourcemaps from 'rollup-plugin-sourcemaps2'

const tsPlugin = typescript({
  declaration: false,
  noEmitOnError: true
})

const external = [
  'fast-copy',
  'process',
  'lodash',
  'qs',
  'p-throttle'
]

const esmConfig = {
  input: 'src/index.ts',
  output: {
    dir: 'dist/esm',
    format: 'esm',
    preserveModules: true,
    sourcemap: true
  },
  plugins: [tsPlugin, sourcemaps()],
  external
}

const cjsConfig = {
  input: 'src/index.ts',
  output: {
    dir: 'dist/cjs',
    format: 'cjs',
    preserveModules: true,
    entryFileNames: '[name].cjs',
    sourcemap: true
  },
  plugins: [tsPlugin, sourcemaps()],
  external
}

// Types build in Rollup
const typesConfig = {
  input: 'src/index.ts',
  output: {
    dir: 'dist/types',
    format: 'esm',
    preserveModules: true,
    sourcemap: true
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      outDir: 'dist/types',
      declaration: true,
      noEmitOnError: true,
      emitDeclarationOnly: true
    })
  ],
  external
}

export default [esmConfig, cjsConfig, typesConfig]
