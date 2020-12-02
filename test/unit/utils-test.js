import test from 'blue-tape'
import { isNode, getNodeVersion } from '../../lib/utils'

test('Detects node properly', (t) => {
  t.equals(isNode(), true, 'detects node as node')
  t.end()
})

test('Detects node properly with babel-polyfill', (t) => {
  global.process.browser = true
  t.equals(isNode(), false, 'detects non-node environment with babel-polyfill')
  delete global.process.browser
  t.end()
})

test('Detects node version', (t) => {
  const version = getNodeVersion()
  t.true(
    version.match(
      /v?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?\b/
    ),
    'detected valid semver node version'
  )
  t.end()
})
