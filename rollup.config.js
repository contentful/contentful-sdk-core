import pkg from './package.json'
import resolve from '@rollup/plugin-node-resolve'
import babel from 'rollup-plugin-babel'

const extensions = [
  '.js', '.ts'
]

export default [
  {
    input: 'lib/index.js',
    output: [
      { file: pkg.module, format: 'esm' },
      { file: pkg.main, format: 'cjs' }
    ],
    plugins: [
      // Allows node_modules resolution
      resolve({ extensions }),
      // Compile TypeScript/JavaScript files
      babel({
        extensions,
        babelrc: false,
        presets: [
          ['@babel/env', {
            modules: false
          }],
          '@babel/typescript'
        ],
        plugins: [
          '@babel/proposal-object-rest-spread'
        ]
      })
    ],
    external: [
      ...Object.keys(pkg.dependencies || []),
      'os'
    ]
  }
]
