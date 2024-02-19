import pkg from './package.json'
import resolve from '@rollup/plugin-node-resolve'
import babel from 'rollup-plugin-babel'

const extensions = ['.js', '.ts']

export default [
  {
    input: 'src/index.ts',
    output: [
      { file: pkg.exports.import, format: 'esm' },
      { file: pkg.exports.require, format: 'cjs' },
    ],
    plugins: [
      // Allows node_modules resolution
      resolve({ extensions }),
      // Compile TypeScript/JavaScript files
      babel({
        extensions,
      }),
    ],
    external: [...Object.keys(pkg.dependencies || []), 'os'],
  },
]
