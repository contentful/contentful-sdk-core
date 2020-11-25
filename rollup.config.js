import pkg from './package.json'
import babel from 'rollup-plugin-babel'

export default [
  {
    input: 'lib/index.js',
    output: [
      { file: pkg.module, format: 'esm' },
      { file: pkg.main, format: 'cjs' }
    ],
    plugins: [
      babel({
        babelrc: false,
        presets: [
          ['@babel/env', {
            modules: false
          }]
        ]
      })
    ],
    external: [
      ...Object.keys(pkg.dependencies || []),
      'os'
    ]
  }
]
